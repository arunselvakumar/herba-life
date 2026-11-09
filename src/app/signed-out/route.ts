import { cookies, headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { KIOSK_PATH } from "@/lib/attendance/constants";
import { findKioskLock } from "@/lib/attendance/kiosk-lock";
import { auth } from "@/lib/auth";

const REASONS = new Set(["suspended"]);

/**
 * Signs the visitor out and sends them to the login page. Server Components
 * cannot clear cookies, so `getCurrentUser()` redirects suspended users here.
 *
 * A device in Attendance Mode is sent back to the kiosk instead: typing this
 * address must not be a way off the tablet.
 */
export async function GET(request: NextRequest) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders }).catch(() => null);
  if (session && (await findKioskLock(session.session.id))) {
    return NextResponse.redirect(new URL(KIOSK_PATH, request.url));
  }

  const reason = request.nextUrl.searchParams.get("reason");
  try {
    await auth.api.signOut({ headers: requestHeaders });
  } catch {
    // No valid session to revoke; just drop the cookies below.
  }
  const ctx = await auth.$context;
  const jar = await cookies();
  for (const cookie of [ctx.authCookies.sessionToken, ctx.authCookies.sessionData]) {
    jar.delete(cookie.name);
  }
  const url = new URL("/login", request.url);
  if (reason && REASONS.has(reason)) url.searchParams.set("reason", reason);
  return NextResponse.redirect(url);
}
