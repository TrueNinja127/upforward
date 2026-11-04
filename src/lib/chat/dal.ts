import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  ApplicationRow,
  ApplicationStatus,
  ConversationOverviewRow,
  ConversationRow,
  MessageRow,
  MessageSender,
} from "@/lib/supabase/types";
import { applicantTokenHash } from "@/lib/session";
import { broadcast } from "./broadcast";
import { adminInboxTopic, conversationTopic, EVENTS, type MessageEvent } from "./channels";
import { resetNotificationMarker, scheduleUnreadNotification } from "./notify";

/*
 * Data Access Layer. Every function here runs with the service-role key, so
 * callers must verify the applicant cookie or the admin session before
 * reaching any write path.
 */

export type ApplicantContext = {
  application: ApplicationRow;
  conversation: ConversationRow;
};

/** Resolves the applicant behind the current request's cookie, if any. */
export const getApplicantContext = cache(async (): Promise<ApplicantContext | null> => {
  const hash = await applicantTokenHash();
  if (!hash) return null;
  const db = supabaseAdmin();
  const { data: session } = await db
    .from("applicant_sessions")
    .select("application_id")
    .eq("token_hash", hash)
    .maybeSingle();
  if (!session) return null;
  const { data: application } = await db
    .from("applications")
    .select("*")
    .eq("id", session.application_id)
    .maybeSingle();
  if (!application) return null;
  const { data: conversation } = await db
    .from("conversations")
    .select("*")
    .eq("application_id", application.id)
    .maybeSingle();
  if (!conversation) return null;
  return { application, conversation };
});

export async function listMessages(conversationId: string, limit = 300): Promise<MessageRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data;
}

/** Stores a message, then fans it out over Realtime to the room and the admin inbox. */
export async function createMessage(
  conversationId: string,
  sender: MessageSender,
  body: string
): Promise<MessageRow> {
  const { data, error } = await supabaseAdmin()
    .from("messages")
    .insert({ conversation_id: conversationId, sender, body })
    .select("*")
    .single();
  if (error) throw error;

  const event: MessageEvent = {
    id: data.id,
    conversation_id: data.conversation_id,
    sender: data.sender,
    body: data.body,
    created_at: data.created_at,
  };
  await Promise.all([
    broadcast(await conversationTopic(conversationId), EVENTS.message, event),
    broadcast(await adminInboxTopic(), EVENTS.inboxUpdate, { conversation_id: conversationId }),
  ]);
  scheduleUnreadNotification(conversationId, sender);
  return data;
}

/** Marks everything the other party sent as read. */
export async function markRead(conversationId: string, reader: MessageSender): Promise<void> {
  const other: MessageSender = reader === "admin" ? "applicant" : "admin";
  const { error, count } = await supabaseAdmin()
    .from("messages")
    .update({ read_at: new Date().toISOString() }, { count: "exact" })
    .eq("conversation_id", conversationId)
    .eq("sender", other)
    .is("read_at", null);
  if (error) throw error;
  if (!count) return;
  await Promise.all([
    resetNotificationMarker(conversationId, reader),
    broadcast(await conversationTopic(conversationId), EVENTS.read, { reader }),
    reader === "admin"
      ? broadcast(await adminInboxTopic(), EVENTS.inboxUpdate, { conversation_id: conversationId })
      : Promise.resolve(),
  ]);
}

/* Admin ----------------------------------------------------------------------- */

/** Cached per request so the admin layout and page share one query. */
export const listConversationOverview = cache(async (): Promise<ConversationOverviewRow[]> => {
  const { data, error } = await supabaseAdmin()
    .from("conversation_overview")
    .select("*")
    .order("last_message_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data;
});

export async function getConversationOverview(conversationId: string): Promise<ConversationOverviewRow | null> {
  const { data, error } = await supabaseAdmin()
    .from("conversation_overview")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateApplicationStatus(applicationId: string, status: ApplicationStatus): Promise<void> {
  const { error } = await supabaseAdmin().from("applications").update({ status }).eq("id", applicationId);
  if (error) throw error;
  await broadcast(await adminInboxTopic(), EVENTS.inboxUpdate, { application_id: applicationId });
}
