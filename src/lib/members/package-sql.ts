import "server-only";

import { and, asc, eq, lte, sql } from "drizzle-orm";
import { memberPackage } from "@/db/schema";

/**
 * The same rules as `visitsLeft` and `isUsable` in `./format`, as SQL. A
 * change to one must be made to the other.
 */

/** Visits not yet taken from a package. */
export const visitsLeftSql = sql<number>`(${memberPackage.visits} + ${memberPackage.extraVisits} - ${memberPackage.visitsUsed})`.mapWith(Number);

export const hasVisitsLeft = sql`${memberPackage.visitsUsed} < ${memberPackage.visits} + ${memberPackage.extraVisits}`;

/** A visit can be taken from a package on `day` when it is open, has started and has visits left. */
export function usableOn(day: string) {
  return and(eq(memberPackage.status, "active"), lte(memberPackage.startDate, day), hasVisitsLeft);
}

/** Visits come off the oldest usable package first, so a renewal waits until the one before it is used up. */
export const oldestFirst = [asc(memberPackage.startDate), asc(memberPackage.createdAt)];
