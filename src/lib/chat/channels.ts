import type { Attachment, ConversationRow, MessageSender } from "@/lib/supabase/types";

/*
 * Realtime channel topics. Broadcast channels are public in Supabase, so the
 * topic itself acts as the capability: it contains the conversation's random
 * `channel_key` from the database, which is handed only to the applicant who
 * owns the conversation (via their cookie session) and to the admin panel.
 *
 * The admin panel (tnboard/src/lib/applicants/types.ts) derives the same topic
 * and speaks the same events, so keep the two in sync.
 */

export function conversationTopic(conversation: Pick<ConversationRow, "id" | "channel_key">): string {
  return `applicant:${conversation.id}:${conversation.channel_key}`;
}

/** Shape of the broadcast payload sent when a message is stored. */
export type MessageEvent = {
  id: string;
  conversation_id: string;
  sender: MessageSender;
  body: string;
  created_at: string;
  /** Attachments with signed download links (valid for an hour). */
  attachments: Attachment[];
};

export type MessageUpdatedEvent = {
  id: string;
  conversation_id: string;
  body: string;
  edited_at: string;
};

export type MessageDeletedEvent = {
  id: string;
  conversation_id: string;
};

export const EVENTS = {
  message: "message",
  updated: "message-updated",
  deleted: "message-deleted",
  typing: "typing",
  read: "read",
} as const;
