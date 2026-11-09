import "server-only";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cacheLife } from "next/cache";
import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { can } from "@/lib/access/can";
import { ALL_PERMISSIONS, type Permission } from "@/lib/access/permissions";
import { KIOSK_PATH } from "@/lib/attendance/constants";
import { findKioskLock } from "@/lib/attendance/kiosk-lock";
import { auth } from "./auth";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  /** Null when no role has been assigned yet: the user can sign in but do nothing. */
  roleId: string | null;
  roleName: string | null;
  /** True for the built-in Administrator role, which always holds every permission. */
  isAdmin: boolean;
  permissions: Permission[];
  /**
   * True while this sign-in (this device) is in Attendance Mode. The user then
   * holds `attendance.kiosk` and nothing else, whatever their role.
   */
  kioskLocked: boolean;
};

/**
 * Resolve the signed-in user's role from the database rather than from the
 * (cookie-cached) session, so a role change or a suspension takes effect on
 * the next request instead of when the cookie cache expires.
 *
 * The Attendance Mode lock is read here too, for this sign-in only: a locked
 * session is narrowed to the one kiosk permission, so every page, Server
 * Action and export that checks `can()` refuses it.
 */
async function resolveUser(userId: string, sessionId: string): Promise<CurrentUser | "suspended" | "missing"> {
  const [row, lock] = await Promise.all([
    db.query.user.findFirst({
      where: eq(userTable.id, userId),
      with: { role: true },
    }),
    findKioskLock(sessionId),
  ]);
  if (!row) return "missing";
  if (!row.isActive) return "suspended";
  const role = row.role;
  const isAdmin = Boolean(role?.isSystem);
  const user: CurrentUser = {
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image ?? null,
    roleId: role?.id ?? null,
    roleName: role?.name ?? null,
    isAdmin,
    permissions: isAdmin ? [...ALL_PERMISSIONS] : ((role?.permissions ?? []) as Permission[]),
    kioskLocked: false,
  };
  if (!lock) return user;
  return {
    ...user,
    isAdmin: false, // can() lets isAdmin through unconditionally, so this must be false
    permissions: can(user, "attendance.kiosk") ? ["attendance.kiosk"] : [],
    kioskLocked: true,
  };
}

/**
 * The signed-in user, lock included.
 *
 * Marked `use cache: private` so the session lookup can be reused within a
 * request and prefetched by the client router, without ever being written to
 * a shared server cache.
 */
async function readUser(): Promise<CurrentUser> {
  "use cache: private";
  cacheLife({ stale: 30, revalidate: 30, expire: 300 });

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  const resolved = await resolveUser(session.user.id, session.session.id);
  if (resolved === "missing") redirect("/login");
  // Rendering cannot clear cookies, so a suspended user is sent through a
  // route handler that signs them out properly.
  if (resolved === "suspended") redirect("/signed-out?reason=suspended");
  return resolved;
}

/**
 * Data Access Layer entry point for every admin page: the signed-in user. A
 * sign-in in Attendance Mode is sent back to the kiosk.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const user = await readUser();
  if (user.kioskLocked) redirect(KIOSK_PATH);
  return user;
}

/** For the kiosk page only: the one place a locked sign-in may render. */
export async function getKioskUser(): Promise<CurrentUser> {
  return readUser();
}

/**
 * Uncached session check for Server Actions, with the id of this sign-in.
 * Actions run outside the render tree, so they cannot use the private-cached
 * `getCurrentUser()`. A locked sign-in is not redirected here: actions refuse
 * it through `requirePermission`, since it only holds `attendance.kiosk`.
 */
export async function requireSession(): Promise<{ user: CurrentUser; sessionId: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  const resolved = await resolveUser(session.user.id, session.session.id);
  if (resolved === "missing") redirect("/login");
  if (resolved === "suspended") throw new Error("Your account has been suspended.");
  return { user: resolved, sessionId: session.session.id };
}

/** `requireSession()` without the session id, for actions that only need the user. */
export async function requireUser(): Promise<CurrentUser> {
  return (await requireSession()).user;
}

/**
 * For Route Handlers that serve files rather than pages: the signed-in user,
 * or null when there is no usable session. The caller decides how to answer
 * (a redirect to the login page, or a 401), since a download link cannot
 * render a page.
 */
export async function findCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const resolved = await resolveUser(session.user.id, session.session.id);
  return typeof resolved === "string" ? null : resolved;
}
