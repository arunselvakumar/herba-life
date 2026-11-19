import "server-only";

import { and, eq, gt, gte, isNull, lte, ne, notExists } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { member, memberPackage } from "@/db/schema";
import { EXPIRY_REMINDER_DAYS } from "@/lib/members/constants";
import { addDays, today } from "@/lib/members/dates";
import { packageExpiryMessage } from "./messages";
import { sendWhatsApp } from "./send";

export type ExpiryReminderRun = { due: number; sent: number; noNumber: number; failed: number };

/**
 * Remind members whose running package ends within `EXPIRY_REMINDER_DAYS`.
 * Meant to run once a day. The window, rather than one exact day, means a run
 * that was missed or that failed is made up for by the next one.
 *
 * A package is reminded about once: it is marked when the message goes out,
 * or when the member has no number to send it to. A failed send is left
 * unmarked so the next run tries again. Members who have already taken a
 * package that runs beyond this one are not reminded.
 */
export async function sendExpiryReminders(day: string = today()): Promise<ExpiryReminderRun> {
  const later = alias(memberPackage, "later_package");
  const due = await db
    .select({
      packageId: memberPackage.id,
      memberId: member.id,
      firstName: member.firstName,
      mobile: member.mobile,
      packageName: memberPackage.name,
      endDate: memberPackage.endDate,
    })
    .from(memberPackage)
    .innerJoin(member, eq(member.id, memberPackage.memberId))
    .where(
      and(
        eq(memberPackage.status, "active"),
        lte(memberPackage.startDate, day),
        gte(memberPackage.endDate, day),
        lte(memberPackage.endDate, addDays(day, EXPIRY_REMINDER_DAYS)),
        isNull(memberPackage.expiryReminderSentAt),
        notExists(
          db
            .select({ id: later.id })
            .from(later)
            .where(and(eq(later.memberId, memberPackage.memberId), ne(later.status, "cancelled"), gt(later.endDate, memberPackage.endDate))),
        ),
      ),
    )
    .orderBy(memberPackage.endDate);

  const run: ExpiryReminderRun = { due: due.length, sent: 0, noNumber: 0, failed: 0 };
  for (const pkg of due) {
    const result = await sendWhatsApp({ memberId: pkg.memberId, mobile: pkg.mobile, message: packageExpiryMessage(pkg) });
    // Sending is switched off here, so nothing was dealt with and nothing is marked.
    if (result === "off") break;
    if (result === "failed") {
      run.failed += 1;
      continue;
    }
    if (result === "sent") run.sent += 1;
    else run.noNumber += 1;
    await db.update(memberPackage).set({ expiryReminderSentAt: new Date() }).where(eq(memberPackage.id, pkg.packageId));
  }
  return run;
}
