import "server-only";
import { cookies } from "next/headers";
import { sha256Hex } from "@/lib/crypto";

/*
 * Applicant session: a random token in an httpOnly cookie, its SHA-256 in
 * `applicant_sessions` (one row per device). Admins sign in on the admin
 * panel (admin.upforward.org), not here.
 */

export const APPLICANT_COOKIE = "uf_applicant";

const YEAR = 60 * 60 * 24 * 365;

const baseCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function setApplicantCookie(rawToken: string) {
  (await cookies()).set(APPLICANT_COOKIE, rawToken, { ...baseCookie, maxAge: YEAR });
}

export async function clearApplicantCookie() {
  (await cookies()).delete(APPLICANT_COOKIE);
}

/** Returns the hash to look up in `applicant_sessions.token_hash`, or null. */
export async function applicantTokenHash(): Promise<string | null> {
  const raw = (await cookies()).get(APPLICANT_COOKIE)?.value;
  if (!raw || raw.length < 20 || raw.length > 128) return null;
  return sha256Hex(raw);
}
