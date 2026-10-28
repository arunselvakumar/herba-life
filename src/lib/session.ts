import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cacheLife } from "next/cache";
import { auth } from "./auth";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
};

/**
 * Data Access Layer entry point for the signed-in user.
 *
 * Marked `use cache: private` so the session lookup can be reused within a
 * request and prefetched by the client router, without ever being written to
 * a shared server cache.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  "use cache: private";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const { user } = session;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    role: user.role ?? "staff",
  };
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
  const { user } = session;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    role: user.role ?? "staff",
  };
}

/** Server Actions that change shared configuration (e.g. the package catalog). */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new Error("Only administrators can do this.");
  }
  return user;
}
