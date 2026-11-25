import "server-only";

import { and, asc, eq, lt, lte, notExists, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { memberPackage } from "@/db/schema";

/**
 * The same rules as `visitsLeft`, `isUsable` and `pickCurrentPackage` in
 * `./format`, as SQL. A change to one must be made to the other.
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

/**
 * The package a member's next visit comes from on `day`: usable, with no
 * older usable package ahead of it. One per member, and the same one
 * `pickCurrentPackage` picks. For `db.select()` queries on `memberPackage`
 * only: the relational API renames the table, which the inner query cannot see.
 */
export function inUseOn(day: string) {
  const earlier = alias(memberPackage, "earlier_package");
  return and(
    usableOn(day),
    notExists(
      db
        .select({ id: earlier.id })
        .from(earlier)
        .where(
          and(
            eq(earlier.memberId, memberPackage.memberId),
            eq(earlier.status, "active"),
            lte(earlier.startDate, day),
            sql`${earlier.visitsUsed} < ${earlier.visits} + ${earlier.extraVisits}`,
            or(
              lt(earlier.startDate, memberPackage.startDate),
              and(eq(earlier.startDate, memberPackage.startDate), lt(earlier.createdAt, memberPackage.createdAt)),
            ),
          ),
        ),
    ),
  );
}
