"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { member } from "@/db/schema";
import { requirePermission } from "@/lib/access/guards";
import { getOlderCalendarMonths, type CalendarMonth } from "./calendar";

const input = z.object({
  memberId: z.uuid(),
  beforeMonth: z.string().regex(/^\d{4}-\d{2}$/),
});

/** Infinite scroll on the member's attendance calendar: the next page of older months. */
export async function loadOlderAttendanceMonths(
  memberId: string,
  beforeMonth: string,
): Promise<{ months: CalendarMonth[]; hasMore: boolean }> {
  await requirePermission("attendance.view");
  const parsed = input.safeParse({ memberId, beforeMonth });
  if (!parsed.success) return { months: [], hasMore: false };
  const found = await db.query.member.findFirst({ where: eq(member.id, parsed.data.memberId), columns: { joinedOn: true } });
  if (!found) return { months: [], hasMore: false };
  return getOlderCalendarMonths(parsed.data.memberId, parsed.data.beforeMonth, found.joinedOn);
}
