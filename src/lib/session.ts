import "server-only";
import { cookies } from "next/headers";
import { sha256Hex } from "@/lib/crypto";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_SECONDS,
  APPLICANT_COOKIE,
  createAdminSessionValue,
  verifyAdminSessionValue,
} from "@/lib/session-core";

export { ADMIN_COOKIE, APPLICANT_COOKIE };

const YEAR = 60 * 60 * 24 * 365;

const baseCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/* Applicant session: a random token in the cookie, its SHA-256 in the database. */

export async function setApplicantCookie(rawToken: string) {
  (await cookies()).set(APPLICANT_COOKIE, rawToken, { ...baseCookie, maxAge: YEAR });
}

export async function clearApplicantCookie() {
  (await cookies()).delete(APPLICANT_COOKIE);
}

/** Returns the hash to look up in `applications.session_token_hash`, or null. */
export async function applicantTokenHash(): Promise<string | null> {
  const raw = (await cookies()).get(APPLICANT_COOKIE)?.value;
  if (!raw || raw.length < 20 || raw.length > 128) return null;
  return sha256Hex(raw);
}

/* Admin session ------------------------------------------------------------- */

export async function setAdminCookie() {
  (await cookies()).set(ADMIN_COOKIE, await createAdminSessionValue(), {
    ...baseCookie,
    maxAge: ADMIN_SESSION_SECONDS,
  });
}

export async function clearAdminCookie() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  return verifyAdminSessionValue((await cookies()).get(ADMIN_COOKIE)?.value);
}
