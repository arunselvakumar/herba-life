import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendance, memberPackage, type AttendanceSource } from "@/db/schema";
import { hasVisitsLeft } from "@/lib/members/package-sql";
import { usablePackageOn, visitOn, type UsablePackage } from "./queries";
import { periodFor } from "./time";

/**
 * Recording and removing visits. A package is a number of visits and a member
 * can take one a day, so every visit written here is also counted against a
 * package, in the same transaction.
 */

export type VisitOutcome =
  | { status: "recorded"; packageName: string; visitsLeft: number }
  /** The member already has a visit on that day; nothing was written. */
  | { status: "already"; checkedInAt: Date }
  /** No open package with visits left on that day; nothing was written. */
  | { status: "no_package" };

class OutOfVisits extends Error {}

/** How often a visit is tried again when another check-in empties the chosen package first. */
const MAX_ATTEMPTS = 3;

type Visit = {
  memberId: string;
  at: Date;
  day: string;
  source: AttendanceSource;
  note?: string | null;
  recordedBy: string;
};

/**
 * Record one visit and take it from the member's oldest usable package.
 *
 * The reads up front give the usual answers cheaply. The transaction is what
 * makes them true: the unique index on (member, day) lets only one of two
 * simultaneous taps through, and the guarded update refuses to take a visit
 * a package no longer has. When that happens the package is chosen again,
 * because the member may have another one with visits left.
 */
export async function takeVisit(visit: Visit): Promise<VisitOutcome> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const existing = await visitOn(visit.memberId, visit.day);
    if (existing) return { status: "already", checkedInAt: existing.checkedInAt };

    const pkg = await usablePackageOn(visit.memberId, visit.day);
    if (!pkg) {
      // Another check-in for this day may have taken the last visit between the two reads.
      const justRecorded = await visitOn(visit.memberId, visit.day);
      return justRecorded ? { status: "already", checkedInAt: justRecorded.checkedInAt } : { status: "no_package" };
    }

    try {
      return await recordOn(pkg, visit);
    } catch (error) {
      if (!(error instanceof OutOfVisits)) throw error;
    }
  }
  return { status: "no_package" };
}

/** Write the visit and count it against `pkg`, or neither. Throws `OutOfVisits` when `pkg` can no longer give one. */
function recordOn(pkg: UsablePackage, visit: Visit): Promise<VisitOutcome> {
  return db.transaction(async (tx): Promise<VisitOutcome> => {
    const [row] = await tx
      .insert(attendance)
      .values({
        memberId: visit.memberId,
        memberPackageId: pkg.id,
        checkedInAt: visit.at,
        day: visit.day,
        period: periodFor(visit.at),
        source: visit.source,
        note: visit.note ?? null,
        recordedBy: visit.recordedBy,
      })
      .onConflictDoNothing({ target: [attendance.memberId, attendance.day] })
      .returning({ id: attendance.id });
    if (!row) {
      const first = await tx.query.attendance.findFirst({
        where: and(eq(attendance.memberId, visit.memberId), eq(attendance.day, visit.day)),
        columns: { checkedInAt: true },
      });
      return { status: "already", checkedInAt: first?.checkedInAt ?? visit.at };
    }

    const [taken] = await tx
      .update(memberPackage)
      .set({ visitsUsed: sql`${memberPackage.visitsUsed} + 1` })
      .where(and(eq(memberPackage.id, pkg.id), eq(memberPackage.status, "active"), hasVisitsLeft))
      .returning({ visits: memberPackage.visits, extraVisits: memberPackage.extraVisits, visitsUsed: memberPackage.visitsUsed });
    // The package was closed or emptied since it was read, so undo the insert.
    if (!taken) throw new OutOfVisits();

    return { status: "recorded", packageName: pkg.name, visitsLeft: taken.visits + taken.extraVisits - taken.visitsUsed };
  });
}

/** Remove a visit and give it back to the package it was taken from. */
export async function removeVisit(id: string): Promise<{ memberId: string } | null> {
  return db.transaction(async (tx) => {
    const [removed] = await tx
      .delete(attendance)
      .where(eq(attendance.id, id))
      .returning({ memberId: attendance.memberId, memberPackageId: attendance.memberPackageId });
    if (!removed) return null;
    if (removed.memberPackageId) {
      await tx
        .update(memberPackage)
        .set({ visitsUsed: sql`greatest(${memberPackage.visitsUsed} - 1, 0)` })
        .where(eq(memberPackage.id, removed.memberPackageId));
    }
    return { memberId: removed.memberId };
  });
}
