import "server-only";

import { and, asc, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendance, type Attendance } from "@/db/schema";
import type { Period, Source } from "./constants";
import { formatTime, lastMonths, monthKey } from "./time";

/** One check-in as the calendar shows it. Times are formatted on the server, in the branch's local time. */
export type CalendarVisit = {
  id: string;
  /** "8:42 am" */
  time: string;
  period: Period;
  source: Source;
  note: string | null;
  recordedBy: string | null;
};

export type CalendarMonth = {
  /** `YYYY-MM` */
  month: string;
  visits: number;
  /** Day of month → the visits on that day, earliest first. Days without a visit are absent. */
  days: Record<number, CalendarVisit[]>;
};

export type MemberCalendar = {
  /** Oldest first, ending with the current month. */
  months: CalendarMonth[];
  /** Whether older months exist before `months[0]` (visits, or the join date). */
  hasMore: boolean;
  total: number;
  thisMonth: number;
  last: Attendance | null;
};

/** How many months the profile loads at first, and per scroll when going further back. */
export const CALENDAR_INITIAL_MONTHS = 12;
export const CALENDAR_PAGE_MONTHS = 6;

function previousMonth(month: string, by = 1): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y ?? 1970, (m ?? 1) - 1 - by, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthsBetween(from: string, to: string): string[] {
  const months: string[] = [];
  for (let m = from; m <= to; m = previousMonth(m, -1)) months.push(m);
  return months;
}

function lastDayOf(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y ?? 1970, m ?? 1, 0);
  return `${month}-${String(d.getDate()).padStart(2, "0")}`;
}

async function loadMonths(memberId: string, fromMonth: string, toMonth: string): Promise<CalendarMonth[]> {
  const rows = await db.query.attendance.findMany({
    where: and(eq(attendance.memberId, memberId), gte(attendance.day, `${fromMonth}-01`), lte(attendance.day, lastDayOf(toMonth))),
    with: { recordedByUser: { columns: { name: true } } },
    orderBy: [asc(attendance.checkedInAt)],
  });

  const byMonth = new Map<string, CalendarMonth>();
  for (const month of monthsBetween(fromMonth, toMonth)) byMonth.set(month, { month, visits: 0, days: {} });
  for (const row of rows) {
    const bucket = byMonth.get(monthKey(row.day));
    if (!bucket) continue;
    const dayOfMonth = Number(row.day.slice(8, 10));
    (bucket.days[dayOfMonth] ??= []).push({
      id: row.id,
      time: formatTime(row.checkedInAt),
      period: row.period,
      source: row.source,
      note: row.note,
      recordedBy: row.source === "manual" ? (row.recordedByUser?.name ?? null) : null,
    });
    bucket.visits += 1;
  }
  return [...byMonth.values()];
}

/** The earliest month worth showing: the join month or the first visit, whichever is older. */
async function earliestMonth(memberId: string, joinedOn: string): Promise<string> {
  const [first] = await db
    .select({ day: sql<string>`min(${attendance.day})` })
    .from(attendance)
    .where(eq(attendance.memberId, memberId));
  const firstVisit = first?.day ? monthKey(first.day) : null;
  const joined = monthKey(joinedOn);
  return firstVisit && firstVisit < joined ? firstVisit : joined;
}

export async function getMemberCalendar(memberId: string, today: string, joinedOn: string): Promise<MemberCalendar> {
  const thisMonthKey = monthKey(today);
  const fromMonth = lastMonths(today, CALENDAR_INITIAL_MONTHS)[0] ?? thisMonthKey;
  const [months, earliest, [total], [thisMonth], last] = await Promise.all([
    loadMonths(memberId, fromMonth, thisMonthKey),
    earliestMonth(memberId, joinedOn),
    db.select({ value: count() }).from(attendance).where(eq(attendance.memberId, memberId)),
    db
      .select({ value: count() })
      .from(attendance)
      .where(and(eq(attendance.memberId, memberId), gte(attendance.day, `${thisMonthKey}-01`))),
    db.query.attendance.findFirst({ where: eq(attendance.memberId, memberId), orderBy: [desc(attendance.checkedInAt)] }),
  ]);
  return {
    months,
    hasMore: earliest < fromMonth,
    total: total?.value ?? 0,
    thisMonth: thisMonth?.value ?? 0,
    last: last ?? null,
  };
}

/** Older months for the infinite scroll: the `count` months ending just before `beforeMonth`. */
export async function getOlderCalendarMonths(
  memberId: string,
  beforeMonth: string,
  joinedOn: string,
  pageSize = CALENDAR_PAGE_MONTHS,
): Promise<{ months: CalendarMonth[]; hasMore: boolean }> {
  const toMonth = previousMonth(beforeMonth);
  const earliest = await earliestMonth(memberId, joinedOn);
  if (earliest > toMonth) return { months: [], hasMore: false };
  const wanted = previousMonth(beforeMonth, pageSize);
  const fromMonth = wanted < earliest ? earliest : wanted;
  const months = await loadMonths(memberId, fromMonth, toMonth);
  return { months, hasMore: earliest < fromMonth };
}
