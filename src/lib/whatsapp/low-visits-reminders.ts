import "server-only";

import { and, eq, gt, isNull, lte, ne, notExists, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { member, memberPackage } from "@/db/schema";
import { LOW_VISITS_REMINDER } from "@/lib/members/constants";
import { visitsLeftSql } from "@/lib/members/package-sql";
import { packageLowVisitsMessage } from "./messages";
import { sendWhatsApp } from "./send";

export type ReminderRun = { due: number; sent: number; noNumber: number; failed: number };

/**
 * Remind members whose package is down to its last `LOW_VISITS_REMINDER`
 * visits. Meant to run once a day. A member can take one visit a day, so a
 * package spends several days in that range and a run that was missed or
 * that failed is made up for by the next one.
 *
 * A package is reminded about once: it is marked when the message goes out,
 * or when the member has no number to send it to. A failed send is left
 * unmarked so the next run tries again. Packages nobody has visited on yet
 * are left alone, as are members who have already taken another package with
 * visits left.
 */
export async function sendLowVisitsReminders(): Promise<ReminderRun> {
  const other = alias(memberPackage, "other_package");
  const due = await db
    .select({
      packageId: memberPackage.id,
      memberId: member.id,
      firstName: member.firstName,
      mobile: member.mobile,
      packageName: memberPackage.name,
      visitsLeft: visitsLeftSql,
    })
    .from(memberPackage)
    .innerJoin(member, eq(member.id, memberPackage.memberId))
    .where(
      and(
        eq(memberPackage.status, "active"),
        gt(memberPackage.visitsUsed, 0),
        gt(visitsLeftSql, 0),
        lte(visitsLeftSql, LOW_VISITS_REMINDER),
        isNull(memberPackage.lowVisitsReminderSentAt),
        notExists(
          db
            .select({ id: other.id })
            .from(other)
            .where(
              and(
                eq(other.memberId, memberPackage.memberId),
                ne(other.id, memberPackage.id),
                eq(other.status, "active"),
                sql`${other.visitsUsed} < ${other.visits} + ${other.extraVisits}`,
              ),
            ),
        ),
      ),
    )
    .orderBy(visitsLeftSql);

  const run: ReminderRun = { due: due.length, sent: 0, noNumber: 0, failed: 0 };
  for (const pkg of due) {
    const result = await sendWhatsApp({ memberId: pkg.memberId, mobile: pkg.mobile, message: packageLowVisitsMessage(pkg) });
    // Sending is switched off here, so nothing was dealt with and nothing is marked.
    if (result === "off") break;
    if (result === "failed") {
      run.failed += 1;
      continue;
    }
    if (result === "sent") run.sent += 1;
    else run.noNumber += 1;
    await db.update(memberPackage).set({ lowVisitsReminderSentAt: new Date() }).where(eq(memberPackage.id, pkg.packageId));
  }
  return run;
}
