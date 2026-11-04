import "server-only";
import { cache } from "react";
import { getJobById } from "@/lib/jobs-db";
import { applicantTokenHash } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ApplicationRow, ConversationRow, JobRow, MessageRow, MessageSender } from "@/lib/supabase/types";
import { broadcast } from "./broadcast";
import { conversationTopic, EVENTS, type MessageEvent } from "./channels";
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
export const normaliseMessage = (m: MessageRow): MessageRow => ({ ...m, created_at: iso(m.created_at), read_at: m.read_at ? iso(m.read_at) : null });

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
  return data.map(normaliseMessage);
}

/**
 * Stores a message and fans it out over Realtime to the conversation. The
 * conversation summary (last message, preview) is kept in sync by a database
 * trigger. Applicant messages also notify the admin panel.
 */
export async function createMessage(
  context: Pick<ApplicantContext, "conversation"> & Partial<Pick<ApplicantContext, "application" | "job">>,
  sender: MessageSender,
  body: string
): Promise<MessageRow> {
  const { conversation } = context;
  const { data, error } = await supabaseAdmin()
    .from("applicant_messages")
    .insert({ conversation_id: conversation.id, sender, body })
    .select("*")
    .single();
  if (error) throw error;
  const message = normaliseMessage(data);

  const event: MessageEvent = {
    id: message.id,
    conversation_id: message.conversation_id,
    sender: message.sender,
    body: message.body,
    created_at: message.created_at,
  };
  await broadcast(conversationTopic(conversation), EVENTS.message, event);

  if (sender === "applicant" && context.application) {
    await notifyPanelOfApplicantMessage({ application: context.application, job: context.job ?? null, conversation, body: message.body });
  }
  return message;
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
