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
 * VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in the panel. Each row remembers the
 * public key it was created with so a mismatch can be reported clearly.
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

export type PushSendResult = { ok: true } | { ok: false; error: string };

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

export type BrowserSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  /** The VAPID public key the browser subscribed with. */
  applicationServerKey?: string | null;
};

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
        application_server_key: input.applicationServerKey ?? null,
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

type Row = Pick<PushSubscriptionRow, "endpoint" | "p256dh" | "auth" | "application_server_key">;

/** Human-readable reason for a failed send, used in logs and in the "test notification" result. */
function describeError(err: unknown): string {
  const e = err as { statusCode?: number; body?: string; message?: string };
  const status = e.statusCode;
  if (status === 401 || status === 403) return `The push service rejected the VAPID credentials (${status}). This browser subscribed with a different public key than the server uses. Use the same key pair on upforward.org and the admin panel, then enable notifications again.`;
  if (status === 404 || status === 410) return `The subscription no longer exists (${status}); enable notifications again in this browser.`;
  if (status === 413) return "The payload is too large (413).";
  if (status === 429) return "The push service is rate-limiting us (429); try again in a minute.";
  if (status) return `Push service error ${status}${e.body ? `: ${String(e.body).slice(0, 200)}` : ""}`;
  return e.message ?? String(err);
}

/** Sends one payload to one subscription. */
async function sendOne(row: Row, payload: PushPayload): Promise<PushSendResult> {
  if (!isPushConfigured()) return { ok: false, error: "VAPID keys are not configured (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)." };
  const details = vapid();
  if (row.application_server_key && row.application_server_key !== details.publicKey) {
    return { ok: false, error: "This browser subscribed with a different VAPID public key than the server uses. upforward.org and the admin panel must share one key pair. Enable notifications again after fixing the keys." };
  }
  try {
    await webpush.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, JSON.stringify(payload), { vapidDetails: details, TTL: 60 * 60 * 24 });
    return { ok: true };
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) await deletePushSubscription(row.endpoint).catch(() => undefined);
    return { ok: false, error: describeError(err) };
  }
}

/** Sends one payload to every given subscription. Never throws; failures are logged. */
export async function sendPush(rows: Row[], payload: PushPayload): Promise<void> {
  if (!isPushConfigured() || !rows.length) return;
  await Promise.all(
    rows.map(async (row) => {
      const res = await sendOne(row, payload);
      if (!res.ok) console.error("[push] send failed:", res.error, row.endpoint.slice(0, 60));
    })
  );
}

const SELECT = "endpoint, p256dh, auth, application_server_key";

/** Pushes to every browser signed in to the admin panel. */
export async function pushToAdmins(payload: PushPayload): Promise<void> {
  if (!isPushConfigured()) return;
  const { data } = await supabaseAdmin().from("push_subscriptions").select(SELECT).eq("scope", "admin");
  await sendPush(data ?? [], payload);
}

/** Pushes to every device an applicant enabled notifications on. */
export async function pushToApplicant(applicationId: string, payload: PushPayload): Promise<void> {
  if (!isPushConfigured()) return;
  const { data } = await supabaseAdmin().from("push_subscriptions").select(SELECT).eq("scope", "applicant").eq("application_id", applicationId);
  await sendPush(data ?? [], payload);
}

/** Sends a test notification to one endpoint and reports the push service's answer. */
export async function sendTestPush(endpoint: string, url: string): Promise<PushSendResult> {
  const { data: row } = await supabaseAdmin().from("push_subscriptions").select(SELECT).eq("endpoint", endpoint).maybeSingle();
  if (!row) return { ok: false, error: "This browser is not subscribed. Enable notifications first." };
  return sendOne(row, { title: "Notifications are on", body: "We'll let you know here when the Upforward team replies, even if this site is closed.", url, tag: "push-test" });
}
