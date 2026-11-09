import "server-only";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { kioskLock, type KioskLock } from "@/db/schema";
import { KIOSK_EXIT_LOCKOUT_SECONDS, KIOSK_EXIT_MAX_ATTEMPTS } from "./constants";

/**
 * The Attendance Mode lock, one row per sign-in (one `session` row = one
 * device). Kept free of `@/lib/session`, which imports this file.
 */

export async function findKioskLock(sessionId: string): Promise<KioskLock | undefined> {
  return db.query.kioskLock.findFirst({ where: eq(kioskLock.sessionId, sessionId) });
}

/** Puts this sign-in into Attendance Mode. A second call is harmless. */
export async function lockKiosk(sessionId: string, userId: string): Promise<void> {
  await db.insert(kioskLock).values({ sessionId, userId }).onConflictDoNothing();
}

export async function unlockKiosk(sessionId: string): Promise<void> {
  await db.delete(kioskLock).where(eq(kioskLock.sessionId, sessionId));
}

export async function registerFailedExit(sessionId: string): Promise<void> {
  await db
    .update(kioskLock)
    .set({ failedAttempts: sql`${kioskLock.failedAttempts} + 1`, lastFailedAt: new Date() })
    .where(eq(kioskLock.sessionId, sessionId));
}

/** Seconds the staff member must wait before the next exit attempt; 0 when they may try now. */
export function exitRetryAfterSeconds(
  lock: Pick<KioskLock, "failedAttempts" | "lastFailedAt">,
  now: Date,
): number {
  if (lock.failedAttempts < KIOSK_EXIT_MAX_ATTEMPTS || !lock.lastFailedAt) return 0;
  const remainingMs = lock.lastFailedAt.getTime() + KIOSK_EXIT_LOCKOUT_SECONDS * 1000 - now.getTime();
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}
