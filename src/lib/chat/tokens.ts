import "server-only";
import { randomToken, sha256Hex } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ApplicationRow, LoginTokenPurpose } from "@/lib/supabase/types";

/*
 * Applicant sessions (cookie tokens, one per device) and email sign-in links.
 * Only hashes are stored; the raw token travels in the cookie or the link.
 * The admin panel issues "notification" links the same way (same hashing) when
 * it emails an applicant about unread replies, and they are consumed here.
 */

const LOGIN_LINK_MINUTES = 15;
const NOTIFICATION_LINK_DAYS = 7;

/** Creates a new device session and returns the raw cookie token. */
export async function createApplicantSession(applicationId: string): Promise<string> {
  const token = randomToken(32);
  const { error } = await supabaseAdmin()
    .from("applicant_sessions")
    .insert({ application_id: applicationId, token_hash: await sha256Hex(token) });
  if (error) throw error;
  return token;
}

export async function deleteApplicantSession(tokenHash: string): Promise<void> {
  await supabaseAdmin().from("applicant_sessions").delete().eq("token_hash", tokenHash);
}

/** Creates a sign-in link token and returns the raw value to embed in the URL. */
export async function createLoginToken(applicationId: string, purpose: LoginTokenPurpose): Promise<string> {
  const db = supabaseAdmin();
  const token = randomToken(32);
  const ttlMs = purpose === "login" ? LOGIN_LINK_MINUTES * 60_000 : NOTIFICATION_LINK_DAYS * 86_400_000;
  const { error } = await db.from("applicant_login_tokens").insert({
    application_id: applicationId,
    token_hash: await sha256Hex(token),
    purpose,
    expires_at: new Date(Date.now() + ttlMs).toISOString(),
  });
  if (error) throw error;
  // Opportunistic cleanup of expired links.
  await db.from("applicant_login_tokens").delete().lt("expires_at", new Date().toISOString());
  return token;
}

/** True when a login link for this application was issued in the last minute (rate limit). */
export async function recentlyIssuedLoginLink(applicationId: string): Promise<boolean> {
  const { data } = await supabaseAdmin()
    .from("applicant_login_tokens")
    .select("id")
    .eq("application_id", applicationId)
    .eq("purpose", "login")
    .gt("created_at", new Date(Date.now() - 60_000).toISOString())
    .limit(1);
  return Boolean(data?.length);
}

export type TokenCheck =
  | { ok: true; application: ApplicationRow; tokenId: string; purpose: LoginTokenPurpose }
  | { ok: false; reason: "invalid" | "expired" | "used" };

/** Validates a raw link token without consuming it. */
export async function checkLoginToken(raw: string | undefined): Promise<TokenCheck> {
  if (!raw || raw.length < 20 || raw.length > 128) return { ok: false, reason: "invalid" };
  const db = supabaseAdmin();
  const { data: row } = await db
    .from("applicant_login_tokens")
    .select("*")
    .eq("token_hash", await sha256Hex(raw))
    .maybeSingle();
  if (!row) return { ok: false, reason: "invalid" };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (row.purpose === "login" && row.used_at) return { ok: false, reason: "used" };
  const { data: application } = await db.from("job_applications").select("*").eq("id", row.application_id).maybeSingle();
  if (!application) return { ok: false, reason: "invalid" };
  return { ok: true, application, tokenId: row.id, purpose: row.purpose };
}

/** Consumes a link token and returns a fresh session cookie token for that applicant. */
export async function consumeLoginToken(raw: string | undefined): Promise<TokenCheck & { sessionToken?: string }> {
  const check = await checkLoginToken(raw);
  if (!check.ok) return check;
  const db = supabaseAdmin();
  if (check.purpose === "login") {
    // Atomic single-use claim.
    const { data } = await db
      .from("applicant_login_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", check.tokenId)
      .is("used_at", null)
      .select("id");
    if (!data?.length) return { ok: false, reason: "used" };
  }
  const sessionToken = await createApplicantSession(check.application.id);
  return { ...check, sessionToken };
}

/** Most recent application for an email address, if any. */
export async function findApplicationByEmail(email: string): Promise<ApplicationRow | null> {
  const { data } = await supabaseAdmin()
    .from("job_applications")
    .select("*")
    .ilike("email", email.trim())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}
