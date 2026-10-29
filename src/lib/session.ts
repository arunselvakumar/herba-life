import "server-only";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cacheLife } from "next/cache";
import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { ALL_PERMISSIONS, type Permission } from "@/lib/access/permissions";
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
};

/**
 * Resolve the signed-in user's role from the database rather than from the
 * (cookie-cached) session, so a role change or a suspension takes effect on
 * the next request instead of when the cookie cache expires.
 */
async function resolveUser(id: string): Promise<CurrentUser | "suspended" | "missing"> {
  const row = await db.query.user.findFirst({
    where: eq(userTable.id, id),
    with: { role: true },
  });
  if (!row) return "missing";
  if (!row.isActive) return "suspended";
  const role = row.role;
  const isAdmin = Boolean(role?.isSystem);
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image ?? null,
    roleId: role?.id ?? null,
    roleName: role?.name ?? null,
    isAdmin,
    permissions: isAdmin ? [...ALL_PERMISSIONS] : ((role?.permissions ?? []) as Permission[]),
  };
}

/**
 * Data Access Layer entry point for the signed-in user.
 *
 * Marked `use cache: private` so the session lookup can be reused within a
 * request and prefetched by the client router, without ever being written to
 * a shared server cache.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  "use cache: private";
  cacheLife({ stale: 30, revalidate: 30, expire: 300 });

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  const resolved = await resolveUser(session.user.id);
  if (resolved === "missing") redirect("/login");
  // Rendering cannot clear cookies, so a suspended user is sent through a
  // route handler that signs them out properly.
  if (resolved === "suspended") redirect("/signed-out?reason=suspended");
  return resolved;
}

/**
 * Uncached session check for Server Actions. Actions run outside the render
 * tree, so they cannot use the private-cached `getCurrentUser()`.
 */
export async function requireUser(): Promise<CurrentUser> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  const resolved = await resolveUser(session.user.id);
  if (resolved === "missing") redirect("/login");
  if (resolved === "suspended") throw new Error("Your account has been suspended.");
  return resolved;
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
  const resolved = await resolveUser(session.user.id);
  return typeof resolved === "string" ? null : resolved;
}
