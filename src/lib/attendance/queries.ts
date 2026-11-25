import "server-only";

import { and, asc, count, eq, exists, gte, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendance, member, memberPackage, type Attendance, type Member } from "@/db/schema";
import { addDays, branchClock } from "@/lib/members/dates";
import { visitsLeft } from "@/lib/members/format";
import { oldestFirst, usableOn } from "@/lib/members/package-sql";
import { KIOSK_SEARCH_LIMIT, NOT_SEEN_AFTER_DAYS, PERIODS, RANGES, type Period, type Range } from "./constants";
import { eachDay, lastMonths, monthKey, weekdayIndex } from "./time";

/** What the kiosk needs about a member: enough to find and recognise themselves, nothing private. */
export type KioskMember = {
  id: string;
  firstName: string;
  lastName: string;
  serialNo: number;
  /** Last four digits of the mobile, to tell two "Priya"s apart. */
  mobileHint: string | null;
  /** Visits left on the package the next visit comes from. */
  packageVisitsLeft: number;
  packageName: string;
};

export type UsablePackage = { id: string; name: string; visits: number; extraVisits: number; visitsUsed: number };

/**
 * Attendance is only for members with visits left. This is the package the
 * visit on `day` comes from: the oldest one that is open, has started and has
 * visits left.
 */
export async function usablePackageOn(memberId: string, day: string): Promise<UsablePackage | null> {
  const row = await db.query.memberPackage.findFirst({
    where: and(eq(memberPackage.memberId, memberId), usableOn(day)),
    columns: { id: true, name: true, visits: true, extraVisits: true, visitsUsed: true },
    orderBy: oldestFirst,
  });
  return row ?? null;
}

/** The member's visit on `day`, if they have one. There is never more than one. */
export async function visitOn(memberId: string, day: string): Promise<Attendance | null> {
  const row = await db.query.attendance.findFirst({ where: and(eq(attendance.memberId, memberId), eq(attendance.day, day)) });
  return row ?? null;
}

/**
 * Members who can check in today, plus those who already have: someone who
 * used their last visit this morning must still find their name, so the
 * kiosk can tell them they are checked in rather than leave them searching.
 */
export async function listKioskMembers(today: string): Promise<KioskMember[]> {
  const [rows, visits] = await Promise.all([
    db.query.member.findMany({
      columns: { id: true, firstName: true, lastName: true, serialNo: true, mobile: true },
      with: {
        packages: {
          columns: { id: true, name: true, visits: true, extraVisits: true, visitsUsed: true },
          where: and(eq(memberPackage.status, "active"), lte(memberPackage.startDate, today)),
          orderBy: oldestFirst,
        },
      },
      orderBy: [asc(member.firstName), asc(member.lastName)],
    }),
    db.select({ memberId: attendance.memberId, packageId: attendance.memberPackageId }).from(attendance).where(eq(attendance.day, today)),
  ]);
  const visitedOn = new Map(visits.map((v) => [v.memberId, v.packageId]));

  return rows.flatMap((row) => {
    const pkg =
      row.packages.find((p) => visitsLeft(p) > 0) ??
      (visitedOn.has(row.id) ? row.packages.find((p) => p.id === visitedOn.get(row.id)) : undefined);
    if (!pkg) return [];
    const digits = row.mobile?.replace(/\D/g, "") ?? "";
    return {
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      serialNo: row.serialNo,
      mobileHint: digits.length >= 4 ? digits.slice(-4) : null,
      packageVisitsLeft: visitsLeft(pkg),
      packageName: pkg.name,
    };
  });
}

/**
 * Kiosk members whose mobile contains `digits`. This runs on the server so
 * the tablet never holds anyone's full number. Who counts is the same as in
 * `listKioskMembers`, and it is decided here, before the limit, so members
 * who cannot check in never crowd out one who can. Stored numbers are free
 * text, so the spaces and dashes are stripped before comparing.
 */
export async function findKioskMemberIdsByMobile(digits: string, today: string): Promise<string[]> {
  const visitedOnIt = exists(
    db
      .select({ id: attendance.id })
      .from(attendance)
      .where(and(eq(attendance.memberId, member.id), eq(attendance.day, today), eq(attendance.memberPackageId, memberPackage.id))),
  );
  const rows = await db
    .selectDistinct({ id: member.id })
    .from(member)
    .innerJoin(memberPackage, eq(memberPackage.memberId, member.id))
    .where(
      and(
        or(usableOn(today), and(eq(memberPackage.status, "active"), lte(memberPackage.startDate, today), visitedOnIt)),
        sql`regexp_replace(${member.mobile}, '\\D', '', 'g') like ${`%${digits}%`}`,
      ),
    )
    .limit(KIOSK_SEARCH_LIMIT);
  return rows.map((row) => row.id);
}

function daysUntil(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const a = Date.UTC(fy ?? 1970, (fm ?? 1) - 1, fd ?? 1);
  const b = Date.UTC(ty ?? 1970, (tm ?? 1) - 1, td ?? 1);
  return Math.round((b - a) / 86_400_000);
}

export type AttendanceRow = Attendance & {
  member: Pick<Member, "id" | "firstName" | "lastName" | "serialNo">;
  recordedByUser: { name: string } | null;
};

/** Every visit on one day, earliest first. */
export async function listDayAttendance(day: string): Promise<AttendanceRow[]> {
  return db.query.attendance.findMany({
    where: eq(attendance.day, day),
    with: {
      member: { columns: { id: true, firstName: true, lastName: true, serialNo: true } },
      recordedByUser: { columns: { name: true } },
    },
    orderBy: [asc(attendance.checkedInAt)],
  });
}

export async function countVisits(memberId: string, from: string, to: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(attendance)
    .where(and(eq(attendance.memberId, memberId), gte(attendance.day, from), lte(attendance.day, to)));
  return row?.value ?? 0;
}

export async function countDay(day: string): Promise<{ visits: number; members: number }> {
  const [row] = await db
    .select({ visits: count(), members: sql<number>`count(distinct ${attendance.memberId})`.mapWith(Number) })
    .from(attendance)
    .where(eq(attendance.day, day));
  return { visits: row?.visits ?? 0, members: row?.members ?? 0 };
}

export type SeriesPoint = { key: string; label: string; visits: number; members: number };

export type RegularRow = {
  member: Pick<Member, "id" | "firstName" | "lastName" | "serialNo">;
  visits: number;
  lastDay: string;
};

export type NotSeenRow = {
  member: Pick<Member, "id" | "firstName" | "lastName" | "serialNo" | "mobile">;
  packageName: string;
  lastDay: string | null;
  daysSince: number | null;
};

export type AttendanceDashboard = {
  day: string;
  range: Range;
  rangeFrom: string;
  rangeTo: string;
  today: { visits: number; members: number; byPeriod: Record<Period, number> };
  yesterday: { visits: number };
  month: { visits: number; members: number; daysWithVisits: number; perDay: number };
  series: SeriesPoint[];
  byHour: number[];
  byWeekday: number[];
  regulars: RegularRow[];
  notSeen: NotSeenRow[];
  log: AttendanceRow[];
};

/**
 * Everything the attendance page shows, for one selected `day` and a chart
 * `range` ending on that day. Visits in the range are pulled once and the
 * histograms are computed in JS, so hour-of-day uses the branch's clock
 * exactly like `day` and `period` did when the row was written.
 */
export async function getAttendanceDashboard(day: string, range: Range, today: string): Promise<AttendanceDashboard> {
  const spec = RANGES.find((r) => r.value === range) ?? RANGES[1];
  const rangeTo = day;
  const rangeFrom = spec.unit === "month" ? `${lastMonths(day, 12)[0]}-01` : addDays(day, -(spec.days - 1));
  const monthStart = `${day.slice(0, 7)}-01`;
  const yesterday = addDays(day, -1);
  const notSeenBefore = addDays(today, -NOT_SEEN_AFTER_DAYS);

  const [log, inRange, monthRows, yesterdayCount, activeMembers, lastVisits] = await Promise.all([
    listDayAttendance(day),
    db
      .select({
        memberId: attendance.memberId,
        day: attendance.day,
        checkedInAt: attendance.checkedInAt,
        firstName: member.firstName,
        lastName: member.lastName,
        serialNo: member.serialNo,
      })
      .from(attendance)
      .innerJoin(member, eq(member.id, attendance.memberId))
      .where(and(gte(attendance.day, rangeFrom), lte(attendance.day, rangeTo))),
    db
      .select({ day: attendance.day, memberId: attendance.memberId })
      .from(attendance)
      .where(and(gte(attendance.day, monthStart), lte(attendance.day, day))),
    db.select({ value: count() }).from(attendance).where(eq(attendance.day, yesterday)),
    db
      .select({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        serialNo: member.serialNo,
        mobile: member.mobile,
        packageName: memberPackage.name,
      })
      .from(memberPackage)
      .innerJoin(member, eq(member.id, memberPackage.memberId))
      .where(usableOn(today))
      .orderBy(...oldestFirst),
    db
      .select({ memberId: attendance.memberId, lastDay: sql<string>`max(${attendance.day})` })
      .from(attendance)
      .groupBy(attendance.memberId),
  ]);

  // Today's split by period comes straight from the day's log.
  const byPeriod = Object.fromEntries(PERIODS.map((p) => [p.value, 0])) as Record<Period, number>;
  for (const row of log) byPeriod[row.period] += 1;

  // Chart series: one bucket per day, or per month for the 12-month view.
  const buckets = new Map<string, { visits: number; members: Set<string> }>();
  const keys = spec.unit === "month" ? lastMonths(day, 12) : eachDay(rangeFrom, rangeTo);
  for (const key of keys) buckets.set(key, { visits: 0, members: new Set() });
  const byHour = Array.from({ length: 24 }, () => 0);
  const byWeekday = Array.from({ length: 7 }, () => 0);
  const perMember = new Map<string, RegularRow>();

  for (const row of inRange) {
    const key = spec.unit === "month" ? monthKey(row.day) : row.day;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.visits += 1;
      bucket.members.add(row.memberId);
    }
    const { hour } = branchClock(row.checkedInAt);
    byHour[hour] = (byHour[hour] ?? 0) + 1;
    const weekday = weekdayIndex(row.checkedInAt);
    byWeekday[weekday] = (byWeekday[weekday] ?? 0) + 1;

    const regular = perMember.get(row.memberId);
    if (regular) {
      regular.visits += 1;
      if (row.day > regular.lastDay) regular.lastDay = row.day;
    } else {
      perMember.set(row.memberId, {
        member: { id: row.memberId, firstName: row.firstName, lastName: row.lastName, serialNo: row.serialNo },
        visits: 1,
        lastDay: row.day,
      });
    }
  }

  const series: SeriesPoint[] = keys.map((key) => {
    const bucket = buckets.get(key) ?? { visits: 0, members: new Set<string>() };
    return { key, label: key, visits: bucket.visits, members: bucket.members.size };
  });

  const regulars = [...perMember.values()].sort((a, b) => b.visits - a.visits || a.lastDay.localeCompare(b.lastDay)).slice(0, 8);

  const lastByMember = new Map(lastVisits.map((v) => [v.memberId, v.lastDay]));
  const seenIds = new Set<string>();
  const notSeen: NotSeenRow[] = [];
  for (const row of activeMembers) {
    if (seenIds.has(row.id)) continue;
    seenIds.add(row.id);
    const lastDay = lastByMember.get(row.id) ?? null;
    if (lastDay && lastDay > notSeenBefore) continue;
    notSeen.push({
      member: { id: row.id, firstName: row.firstName, lastName: row.lastName, serialNo: row.serialNo, mobile: row.mobile },
      packageName: row.packageName,
      lastDay,
      daysSince: lastDay ? daysUntil(lastDay, today) : null,
    });
  }
  notSeen.sort((a, b) => (b.daysSince ?? Number.MAX_SAFE_INTEGER) - (a.daysSince ?? Number.MAX_SAFE_INTEGER));

  const monthDays = new Set(monthRows.map((r) => r.day));
  const monthMembers = new Set(monthRows.map((r) => r.memberId));

  return {
    day,
    range: spec.value,
    rangeFrom,
    rangeTo,
    today: { visits: log.length, members: new Set(log.map((r) => r.memberId)).size, byPeriod },
    yesterday: { visits: yesterdayCount[0]?.value ?? 0 },
    month: {
      visits: monthRows.length,
      members: monthMembers.size,
      daysWithVisits: monthDays.size,
      perDay: monthDays.size ? Math.round((monthRows.length / monthDays.size) * 10) / 10 : 0,
    },
    series,
    byHour,
    byWeekday,
    regulars,
    notSeen,
    log,
  };
}

/** Members for the staff "record a visit" picker: those with a package that has started by `day` and has visits left. */
export async function listMemberOptions(day: string): Promise<Pick<Member, "id" | "firstName" | "lastName" | "serialNo">[]> {
  return db
    .selectDistinct({ id: member.id, firstName: member.firstName, lastName: member.lastName, serialNo: member.serialNo })
    .from(member)
    .innerJoin(memberPackage, eq(memberPackage.memberId, member.id))
    .where(usableOn(day))
    .orderBy(asc(member.firstName), asc(member.lastName));
}
