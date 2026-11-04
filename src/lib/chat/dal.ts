import "server-only";
import { cache } from "react";
import { getJobById } from "@/lib/jobs-db";
import { applicantTokenHash } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ApplicationRow, ConversationRow, JobRow, MessageRow, MessageSender } from "@/lib/supabase/types";
import { removeAttachments, signAttachments, uploadAttachments } from "./attachments";
import { broadcast } from "./broadcast";
import { conversationTopic, EVENTS, type MessageDeletedEvent, type MessageEvent, type MessageUpdatedEvent } from "./channels";
import { notifyPanelOfApplicantMessage, resetNotificationMarker } from "./notify";
import { publishPanelEvent } from "./panel";

/*
 * Data Access Layer for the applicant side of the chat. Every function runs
 * with the service-role key, so callers must verify the applicant cookie
 * before reaching any write path. The admin side lives in the admin panel
 * (tnboard/src/lib/applicants/dal.ts) and writes to the same tables.
 */

export type ApplicantContext = {
  application: ApplicationRow;
  /** Null only if the role was deleted after they applied. */
  job: JobRow | null;
  conversation: ConversationRow;
};

/** PostgREST returns timestamps with a "+00:00" offset; the UI and the panel use the "Z" form. */
const iso = (value: string) => new Date(value).toISOString();
export const normaliseMessage = (m: MessageRow): MessageRow => ({
  ...m,
  created_at: iso(m.created_at),
  read_at: m.read_at ? iso(m.read_at) : null,
  edited_at: m.edited_at ? iso(m.edited_at) : null,
  deleted_at: m.deleted_at ? iso(m.deleted_at) : null,
  attachments: Array.isArray(m.attachments) ? m.attachments : [],
});

/** Resolves the applicant behind the current request's cookie, if any. */
export const getApplicantContext = cache(async (): Promise<ApplicantContext | null> => {
  const hash = await applicantTokenHash();
  if (!hash) return null;
  const db = supabaseAdmin();
  const { data: session } = await db.from("applicant_sessions").select("application_id").eq("token_hash", hash).maybeSingle();
  if (!session) return null;
  const { data: application } = await db.from("job_applications").select("*").eq("id", session.application_id).maybeSingle();
  if (!application) return null;
  const [job, { data: conversation }] = await Promise.all([
    getJobById(application.job_id).catch(() => null),
    db.from("applicant_conversations").select("*").eq("application_id", application.id).maybeSingle(),
  ]);
  if (!conversation) return null;
  return { application, job, conversation };
});

export async function listMessages(conversationId: string, limit = 300): Promise<MessageRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("applicant_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return signAttachments(data.map(normaliseMessage));
}

/**
 * Stores a message (with optional files) and fans it out over Realtime to the
 * conversation. The conversation summary (last message, preview) is kept in
 * sync by a database trigger. Applicant messages also notify the admin panel.
 */
export async function createMessage(
  context: Pick<ApplicantContext, "conversation"> & Partial<Pick<ApplicantContext, "application" | "job">>,
  sender: MessageSender,
  body: string,
  files: File[] = []
): Promise<MessageRow> {
  const { conversation } = context;
  const attachments = await uploadAttachments(conversation.id, files);
  const { data, error } = await supabaseAdmin()
    .from("applicant_messages")
    .insert({ conversation_id: conversation.id, sender, body, attachments })
    .select("*")
    .single();
  if (error) {
    await removeAttachments(attachments.map((a) => a.path));
    throw error;
  }
  const [message] = await signAttachments([normaliseMessage(data)]);

  const event: MessageEvent = {
    id: message.id,
    conversation_id: message.conversation_id,
    sender: message.sender,
    body: message.body,
    created_at: message.created_at,
    attachments: message.attachments,
  };
  await broadcast(conversationTopic(conversation), EVENTS.message, event);

  if (sender === "applicant" && context.application) {
    await notifyPanelOfApplicantMessage({
      application: context.application,
      job: context.job ?? null,
      conversation,
      body: message.body || (message.attachments.length ? `Sent ${message.attachments.length === 1 ? "a file" : `${message.attachments.length} files`}` : ""),
    });
  }
  return message;
}

/** Loads one of the caller's own, not yet deleted messages in this conversation. */
async function ownMessage(conversation: Pick<ConversationRow, "id">, sender: MessageSender, messageId: string): Promise<MessageRow> {
  const { data } = await supabaseAdmin()
    .from("applicant_messages")
    .select("*")
    .eq("id", messageId)
    .eq("conversation_id", conversation.id)
    .eq("sender", sender)
    .maybeSingle();
  if (!data) throw new Error("Message not found.");
  if (data.deleted_at) throw new Error("This message was deleted.");
  return normaliseMessage(data);
}

/** Changes the text of one of the caller's messages and tells the other side. */
export async function editMessage(conversation: Pick<ConversationRow, "id" | "channel_key">, sender: MessageSender, messageId: string, body: string): Promise<MessageRow> {
  await ownMessage(conversation, sender, messageId);
  const { data, error } = await supabaseAdmin()
    .from("applicant_messages")
    .update({ body, edited_at: new Date().toISOString() })
    .eq("id", messageId)
    .select("*")
    .single();
  if (error) throw error;
  const [message] = await signAttachments([normaliseMessage(data)]);
  const event: MessageUpdatedEvent = { id: message.id, conversation_id: message.conversation_id, body: message.body, edited_at: message.edited_at! };
  await Promise.all([
    broadcast(conversationTopic(conversation), EVENTS.updated, event),
    publishPanelEvent({ kind: "applicants", conversationId: conversation.id }),
  ]);
  return message;
}

/** Soft-deletes one of the caller's messages (text and files removed, row kept) and tells the other side. */
export async function deleteMessage(conversation: Pick<ConversationRow, "id" | "channel_key">, sender: MessageSender, messageId: string): Promise<void> {
  const message = await ownMessage(conversation, sender, messageId);
  const { error } = await supabaseAdmin()
    .from("applicant_messages")
    .update({ body: "", attachments: [], deleted_at: new Date().toISOString() })
    .eq("id", messageId);
  if (error) throw error;
  await removeAttachments(message.attachments.map((a) => a.path));
  const event: MessageDeletedEvent = { id: messageId, conversation_id: conversation.id };
  await Promise.all([
    broadcast(conversationTopic(conversation), EVENTS.deleted, event),
    publishPanelEvent({ kind: "applicants", conversationId: conversation.id }),
  ]);
}

/** Marks everything the other party sent as read. */
export async function markRead(conversation: ConversationRow, reader: MessageSender): Promise<void> {
  const other: MessageSender = reader === "admin" ? "applicant" : "admin";
  const { error, count } = await supabaseAdmin()
    .from("applicant_messages")
    .update({ read_at: new Date().toISOString() }, { count: "exact" })
    .eq("conversation_id", conversation.id)
    .eq("sender", other)
    .is("read_at", null);
  if (error) throw error;
  if (!count) return;
  await Promise.all([
    resetNotificationMarker(conversation.id, reader),
    broadcast(conversationTopic(conversation), EVENTS.read, { reader }),
    // Read receipts matter to the panel's open chat ("Seen").
    publishPanelEvent({ kind: "applicants", conversationId: conversation.id, applicationId: conversation.application_id }),
  ]);
}
