import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminSessionValue } from "@/lib/session-core";

/**
 * Optimistic auth check for the admin area: redirects visitors without a valid
 * admin cookie to the sign-in page. The real check happens again in the admin
 * layout and in every admin Server Action.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const ok = await verifyAdminSessionValue(request.cookies.get(ADMIN_COOKIE)?.value);
  if (ok) return NextResponse.next();

  const url = new URL("/admin/login", request.url);
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
