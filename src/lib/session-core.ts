import { authSecret, hmacHex, safeEqual } from "@/lib/crypto";

/*
 * Framework-free session primitives shared by proxy.ts and the server-side
 * session helpers. Nothing here touches next/headers.
 */

export const APPLICANT_COOKIE = "uf_applicant";
export const ADMIN_COOKIE = "uf_admin";

export const ADMIN_SESSION_SECONDS = 60 * 60 * 12;

/** Admin session value: stateless, HMAC-signed "exp.signature". */
export async function createAdminSessionValue(): Promise<string> {
  const exp = String(Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS);
  const sig = await hmacHex(authSecret(), `admin:${exp}`);
  return `${exp}.${sig}`;
}

export async function verifyAdminSessionValue(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp)) return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false;
  try {
    const expected = await hmacHex(authSecret(), `admin:${exp}`);
    return await safeEqual(expected, sig);
  } catch {
    return false;
  }
}
