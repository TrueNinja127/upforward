import { authSecret, hmacHex } from "@/lib/crypto";

/*
 * Realtime channel topics. Broadcast channels are public in Supabase, so the
 * topic itself acts as the capability: it includes an HMAC that only the
 * server can compute, and it is handed only to the applicant who owns the
 * conversation (via their cookie session) or to a signed-in admin.
 */

export async function conversationTopic(conversationId: string): Promise<string> {
  const sig = (await hmacHex(authSecret(), `conversation:${conversationId}`)).slice(0, 32);
  return `conv:${conversationId}:${sig}`;
}

export async function adminInboxTopic(): Promise<string> {
  const sig = (await hmacHex(authSecret(), "admin-inbox")).slice(0, 32);
  return `inbox:${sig}`;
}

/** Shape of the broadcast payload sent when a message is stored. */
export type MessageEvent = {
  id: string;
  conversation_id: string;
  sender: "applicant" | "admin";
  body: string;
  created_at: string;
};

export const EVENTS = {
  message: "message",
  typing: "typing",
  read: "read",
  inboxUpdate: "inbox-update",
} as const;
