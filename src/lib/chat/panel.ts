import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { broadcast } from "./broadcast";

/*
 * Hooks into the admin panel (admin.upforward.org), which shares this database:
 * live "something changed" pings on the panel's Realtime channel, rows in its
 * notification bell and in its activity feed. Everything here is best effort –
 * the applicant's own flow never fails because the panel could not be told.
 */

const LIVE_CHANNEL_PREFIX = "upforward-live-";

/** The panel-wide channel name, keyed by a random value stored on its Settings row. */
export const liveTopic = cache(async (): Promise<string | null> => {
  try {
    const { data, error } = await supabaseAdmin().from("Settings").select("liveChannelKey").eq("id", 1).maybeSingle();
    if (error) throw error;
    return data?.liveChannelKey ? `${LIVE_CHANNEL_PREFIX}${data.liveChannelKey}` : null;
  } catch (err) {
    console.error("[panel] could not read live channel key", err);
    return null;
  }
});

export type PanelEvent = { kind: "applicants"; conversationId?: string; applicationId?: string } | { kind: "notification" };

/** Tells open admin panels to refresh. */
export async function publishPanelEvent(event: PanelEvent): Promise<void> {
  const topic = await liveTopic();
  if (!topic) return;
  await broadcast(topic, event.kind, event);
}

/** Adds an entry to the panel's notification bell. */
export async function createPanelNotification(input: { type: "message" | "contact"; title: string; body?: string | null; link?: string | null }): Promise<void> {
  const { error } = await supabaseAdmin().from("Notification").insert({
    id: crypto.randomUUID(),
    type: input.type,
    title: input.title.slice(0, 200),
    body: input.body?.slice(0, 500) ?? null,
    link: input.link ?? null,
  });
  if (error) {
    console.error("[panel] notification insert failed", error);
    return;
  }
  await publishPanelEvent({ kind: "notification" });
}

/** Adds a line to the panel's activity feed. */
export async function logPanelActivity(type: string, message: string, meta: Record<string, unknown> = {}): Promise<void> {
  const { error } = await supabaseAdmin().from("ActivityLog").insert({ id: crypto.randomUUID(), type, message, meta: JSON.stringify(meta) });
  if (error) console.error("[panel] activity insert failed", error);
}
