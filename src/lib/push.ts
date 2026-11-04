import "server-only";
import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { PushScope, PushSubscriptionRow } from "@/lib/supabase/types";

/*
 * Web Push: notifications that reach the browser even when the site is closed.
 *
 * Browsers subscribe through the service worker (public/sw.js) and the
 * subscription is stored in `push_subscriptions`. Applicant subscriptions are
 * pushed by the admin panel when the team replies; admin subscriptions are
 * pushed from here when someone applies or writes. Both apps therefore share
 * ONE VAPID key pair: NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY here,
 * VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in the panel.
 */

export type PushPayload = {
  title: string;
  body?: string;
  /** Opened when the notification is clicked. */
  url?: string;
  /** Notifications with the same tag replace each other. */
  tag?: string;
  /** Do not show when a window of the site is focused (the page shows it inline instead). */
  skipIfFocused?: boolean;
};

export function pushPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}

export function isPushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function vapid() {
  return {
    subject: process.env.VAPID_SUBJECT || "mailto:info@upforward.org",
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    privateKey: process.env.VAPID_PRIVATE_KEY!,
  };
}

export type BrowserSubscription = { endpoint: string; keys: { p256dh: string; auth: string } };

export async function savePushSubscription(input: BrowserSubscription & { scope: PushScope; applicationId?: string | null; userAgent?: string | null }): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("push_subscriptions")
    .upsert(
      {
        scope: input.scope,
        application_id: input.applicationId ?? null,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        user_agent: input.userAgent?.slice(0, 300) ?? null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );
  if (error) throw error;
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  await supabaseAdmin().from("push_subscriptions").delete().eq("endpoint", endpoint);
}

/** Sends one payload to every given subscription, dropping endpoints the browser has revoked. */
export async function sendPush(rows: PushSubscriptionRow[], payload: PushPayload): Promise<void> {
  if (!isPushConfigured() || !rows.length) return;
  const details = vapid();
  const body = JSON.stringify(payload);
  await Promise.all(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, body, { vapidDetails: details, TTL: 60 * 60 * 24 });
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await deletePushSubscription(row.endpoint);
        else console.error("[push] send failed", status, (err as Error).message);
      }
    })
  );
}

/** Pushes to every browser signed in to the admin panel. */
export async function pushToAdmins(payload: PushPayload): Promise<void> {
  if (!isPushConfigured()) return;
  const { data } = await supabaseAdmin().from("push_subscriptions").select("*").eq("scope", "admin");
  await sendPush(data ?? [], payload);
}

/** Pushes to every device an applicant enabled notifications on. */
export async function pushToApplicant(applicationId: string, payload: PushPayload): Promise<void> {
  if (!isPushConfigured()) return;
  const { data } = await supabaseAdmin().from("push_subscriptions").select("*").eq("scope", "applicant").eq("application_id", applicationId);
  await sendPush(data ?? [], payload);
}
