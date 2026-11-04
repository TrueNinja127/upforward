"use server";

import { createMessage, getApplicantContext, listMessages, markRead } from "@/lib/chat/dal";
import type { MessageRow } from "@/lib/supabase/types";

export type SendResult = { message: MessageRow } | { error: string };

async function requireApplicant() {
  const ctx = await getApplicantContext();
  if (!ctx) throw new Error("Your session has expired. Please apply again to start a new chat.");
  return ctx;
}

export async function sendApplicantMessage(body: string): Promise<SendResult> {
  const trimmed = typeof body === "string" ? body.trim() : "";
  if (!trimmed) return { error: "Message can't be empty." };
  if (trimmed.length > 4000) return { error: "Message is too long (4000 characters max)." };
  try {
    const { conversation } = await requireApplicant();
    const message = await createMessage(conversation.id, "applicant", trimmed);
    return { message };
  } catch (err) {
    console.error("[chat] applicant send failed", err);
    return { error: err instanceof Error ? err.message : "Could not send your message." };
  }
}

export async function markApplicantRead(): Promise<void> {
  try {
    const { conversation } = await requireApplicant();
    await markRead(conversation.id, "applicant");
  } catch (err) {
    console.error("[chat] applicant markRead failed", err);
  }
}

/** Returns messages created after `after` (ISO timestamp), used to catch up after a disconnect. */
export async function syncApplicantMessages(after: string | null): Promise<MessageRow[]> {
  try {
    const { conversation } = await requireApplicant();
    const all = await listMessages(conversation.id);
    return after ? all.filter((m) => m.created_at > after) : all;
  } catch (err) {
    console.error("[chat] applicant sync failed", err);
    return [];
  }
}
