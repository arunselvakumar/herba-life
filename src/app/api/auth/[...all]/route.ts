import { toNextJsHandler } from "better-auth/next-js";
import { findKioskLock } from "@/lib/attendance/kiosk-lock";
import { auth } from "@/lib/auth";

const handlers = toNextJsHandler(auth);

/**
 * A sign-in in Attendance Mode gets nothing from Better Auth: the kiosk never
 * calls it, and `get-session` or `list-sessions` would otherwise hand the
 * staff member's email and sessions to whoever is at the tablet.
 */
async function lockedOut(request: Request): Promise<Response | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || !(await findKioskLock(session.session.id))) return null;
  return new Response("Attendance Mode is on.", { status: 403 });
}

export async function GET(request: Request) {
  return (await lockedOut(request)) ?? handlers.GET(request);
}

export async function POST(request: Request) {
  return (await lockedOut(request)) ?? handlers.POST(request);
}
