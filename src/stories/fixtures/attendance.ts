import type { Attendance } from "@/db/schema";
import type { KioskCheckInResult } from "@/lib/attendance/actions";
import type { CalendarMonth, CalendarVisit, MemberCalendar } from "@/lib/attendance/calendar";
import { RANGES, type Period, type Range } from "@/lib/attendance/constants";
import type { AttendanceDashboard, AttendanceRow, KioskMember, NotSeenRow, RegularRow, SeriesPoint } from "@/lib/attendance/queries";
import { eachDay, formatTime, lastMonths, periodFor } from "@/lib/attendance/time";
import { addDays } from "@/lib/members/dates";
import { at, daysFromToday, TODAY } from "./time";
import { adminUser, frontDeskUser } from "./users";

// ---------------------------------------------------------------------------
// Kiosk
// ---------------------------------------------------------------------------

const kioskId = (n: number) => `4d5e6f70-0000-4000-8000-${String(n).padStart(12, "0")}`;

export function makeKioskMember(overrides: Partial<KioskMember> & Pick<KioskMember, "serialNo">): KioskMember {
  return {
    id: kioskId(overrides.serialNo),
    firstName: "Priya",
    lastName: "Sharma",
    mobileHint: "2345",
    packageDaysLeft: 42,
    packageName: "3 months",
    ...overrides,
  };
}

export const kioskPriya = makeKioskMember({ serialNo: 101, firstName: "Priya", lastName: "Sharma", mobileHint: "2345" });
export const kioskPriyaNair = makeKioskMember({ serialNo: 134, firstName: "Priya", lastName: "Nair", mobileHint: "7781", packageDaysLeft: 3, packageName: "1 month" });
export const kioskRahul = makeKioskMember({ serialNo: 102, firstName: "Rahul", lastName: "Iyer", mobileHint: "4410" });
/** Not in the kiosk's list by mobile hint: only the server can find "98400 77…" for her. */
export const mobileLookupMember = makeKioskMember({ serialNo: 106, firstName: "Lakshmi", lastName: "Venkatesh", mobileHint: "3021" });

/** A typical morning's list: two Priyas (told apart by their mobile), a long name, one with no mobile. */
export const kioskMembers = [
  kioskPriya,
  kioskPriyaNair,
  kioskRahul,
  makeKioskMember({ serialNo: 103, firstName: "Karthik", lastName: "Subramanian", mobileHint: "9012", packageDaysLeft: 0, packageName: "1 month" }),
  makeKioskMember({ serialNo: 104, firstName: "Anitha", lastName: "Rajan", mobileHint: "5566" }),
  makeKioskMember({ serialNo: 105, firstName: "Mohammed", lastName: "Faizal", mobileHint: null, packageDaysLeft: 1 }),
  mobileLookupMember,
  makeKioskMember({ serialNo: 107, firstName: "Suresh", lastName: "Babu", mobileHint: "8890", packageName: "6 months", packageDaysLeft: 120 }),
  makeKioskMember({ serialNo: 108, firstName: "Divya", lastName: "Krishnan", mobileHint: "1203" }),
  makeKioskMember({ serialNo: 109, firstName: "Venkatalakshmi", lastName: "Ramachandran Subramaniam", mobileHint: "6655" }),
  makeKioskMember({ serialNo: 110, firstName: "Arjun", lastName: "Menon", mobileHint: "7432" }),
  makeKioskMember({ serialNo: 111, firstName: "Fathima", lastName: "Begum", mobileHint: "2290" }),
  makeKioskMember({ serialNo: 112, firstName: "Gopal", lastName: "Pillai", mobileHint: "9981" }),
  makeKioskMember({ serialNo: 113, firstName: "Sneha", lastName: "Reddy", mobileHint: "4521" }),
] satisfies KioskMember[];

export const checkInResults = {
  checkedIn: { status: "checked_in", firstName: "Priya", time: "10:30 am", visitsThisMonth: 7, todayVisits: 24 },
  firstOfMonth: { status: "checked_in", firstName: "Priya", time: "10:30 am", visitsThisMonth: 1, todayVisits: 24 },
  already: { status: "already", firstName: "Priya", time: "7:42 am", todayVisits: 23 },
  noPackage: { status: "no_package", firstName: "Priya" },
  error: { status: "error", message: "We could not reach the server. Please try again in a moment." },
} satisfies Record<string, KioskCheckInResult>;

// ---------------------------------------------------------------------------
// Day log
// ---------------------------------------------------------------------------

let rowSeq = 0;
const rowId = () => `5e6f7081-0000-4000-8000-${String(++rowSeq).padStart(12, "0")}`;

type RowInput = {
  member: KioskMember;
  days: number;
  hour: number;
  minute: number;
  source?: Attendance["source"];
  note?: string;
  by?: { id: string; name: string };
};

function makeRow({ member, days, hour, minute, source = "kiosk", note, by = adminUser }: RowInput): AttendanceRow {
  const checkedInAt = at(days, hour, minute);
  return {
    id: rowId(),
    memberId: member.id,
    checkedInAt,
    day: daysFromToday(days),
    period: periodFor(checkedInAt),
    source,
    note: note ?? null,
    recordedBy: by.id,
    createdAt: checkedInAt,
    member: { id: member.id, firstName: member.firstName, lastName: member.lastName, serialNo: member.serialNo },
    recordedByUser: { name: by.name },
  };
}

const m = (i: number): KioskMember => kioskMembers[i % kioskMembers.length] ?? kioskPriya;

/** This morning so far (the clock reads 10:30): breakfast-shake visitors only. */
export const todayRows = [
  makeRow({ member: m(0), days: 0, hour: 6, minute: 12 }),
  makeRow({ member: m(2), days: 0, hour: 6, minute: 48 }),
  makeRow({ member: m(4), days: 0, hour: 7, minute: 5 }),
  makeRow({ member: m(6), days: 0, hour: 7, minute: 42, source: "manual", note: "Tablet was charging", by: frontDeskUser }),
  makeRow({ member: m(1), days: 0, hour: 8, minute: 20 }),
  makeRow({ member: m(8), days: 0, hour: 9, minute: 55 }),
] satisfies AttendanceRow[];

/** Yesterday, morning to evening: kiosk and staff-recorded visits, notes, a member who came twice. */
export const busyDayRows = [
  makeRow({ member: m(0), days: -1, hour: 6, minute: 5 }),
  makeRow({ member: m(2), days: -1, hour: 6, minute: 30 }),
  makeRow({ member: m(3), days: -1, hour: 6, minute: 52 }),
  makeRow({ member: m(4), days: -1, hour: 7, minute: 15 }),
  makeRow({ member: m(5), days: -1, hour: 7, minute: 40, source: "manual", note: "Forgot to tap, came for a refill", by: frontDeskUser }),
  makeRow({ member: m(9), days: -1, hour: 8, minute: 2 }),
  makeRow({ member: m(10), days: -1, hour: 8, minute: 44 }),
  makeRow({ member: m(11), days: -1, hour: 12, minute: 30 }),
  makeRow({ member: m(12), days: -1, hour: 13, minute: 10, source: "manual", note: "Tablet was off for an update, recorded from the paper register at the counter", by: adminUser }),
  makeRow({ member: m(0), days: -1, hour: 17, minute: 25 }),
  makeRow({ member: m(6), days: -1, hour: 18, minute: 5 }),
  makeRow({ member: m(13), days: -1, hour: 19, minute: 40 }),
] satisfies AttendanceRow[];

/** For the "Record a visit" dialog's member select. */
export const memberOptions = kioskMembers.map(({ id, firstName, lastName, serialNo }) => ({ id, firstName, lastName, serialNo }));

// ---------------------------------------------------------------------------
// Member calendar
// ---------------------------------------------------------------------------

export const calendarMemberId = kioskPriya.id;

let visitSeq = 0;

function visit(dayKey: string, hour: number, minute: number, source: CalendarVisit["source"] = "kiosk", note: string | null = null): CalendarVisit {
  const [y, mo, d] = dayKey.split("-").map(Number);
  const instant = new Date(Date.UTC(y ?? 1970, (mo ?? 1) - 1, d ?? 1, 0, hour * 60 + minute - 330));
  return {
    id: `6f708192-0000-4000-8000-${String(++visitSeq).padStart(12, "0")}`,
    time: formatTime(instant),
    period: periodFor(instant),
    source,
    note,
    recordedBy: source === "manual" ? frontDeskUser.name : null,
  };
}

function daysInMonth(month: string): number {
  const [y, mo] = month.split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, mo ?? 1, 0)).getUTCDate();
}

/**
 * One month of a regular's visits, with a fixed pattern so it renders the
 * same every run: most mornings, a second visit some evenings, the odd
 * staff-recorded day. Days before `from` or after `TODAY` stay empty.
 */
export function makeCalendarMonth(month: string, { from = "0000-00-00", seed = 0 }: { from?: string; seed?: number } = {}): CalendarMonth {
  const days: Record<number, CalendarVisit[]> = {};
  let visits = 0;
  for (let d = 1; d <= daysInMonth(month); d++) {
    const key = `${month}-${String(d).padStart(2, "0")}`;
    if (key > TODAY || key < from) continue;
    const roll = (d * 7 + seed * 3) % 10;
    if (roll < 3) continue; // ~30% of days, no visit
    const list = [visit(key, 6 + (d % 3), (d * 13) % 60, roll === 9 ? "manual" : "kiosk", roll === 9 ? "Tablet was off" : null)];
    if (roll >= 7) list.push(visit(key, 18, (d * 7) % 60));
    if (roll === 8) list.push(visit(key, 13, 15));
    days[d] = list;
    visits += list.length;
  }
  return { month, visits, days };
}

function totals(months: CalendarMonth[]) {
  return {
    total: months.reduce((sum, mo) => sum + mo.visits, 0),
    thisMonth: months[months.length - 1]?.visits ?? 0,
  };
}

/** The visit `MemberAttendance` reports as "Last visit". */
export const lastVisit = {
  id: rowId(),
  memberId: calendarMemberId,
  checkedInAt: at(0, 7, 42),
  day: TODAY,
  period: "morning",
  source: "kiosk",
  note: null,
  recordedBy: adminUser.id,
  createdAt: at(0, 7, 42),
} satisfies Attendance;

/** A member who joined over a year ago: the latest 12 months, older ones still to load. */
export const regularJoinedOn = daysFromToday(-540);
export const regularMonths: CalendarMonth[] = lastMonths(TODAY, 12).map((month, i) => makeCalendarMonth(month, { seed: i }));
export const regularCalendar = {
  months: regularMonths,
  hasMore: true,
  ...totals(regularMonths),
  last: lastVisit,
} satisfies MemberCalendar;

/** What "load older months" returns for the regular: six more, back to when they joined. */
export const olderMonths: CalendarMonth[] = lastMonths(addDays(`${regularMonths[0]?.month ?? "2025-12"}-01`, -1), 6).map((month, i) =>
  makeCalendarMonth(month, { seed: i + 20 }),
);

/** Joined on the 20th of last month: two months, the first only partly coloured. */
export const midMonthJoinedOn = daysFromToday(-20);
export const midMonthMonths: CalendarMonth[] = lastMonths(TODAY, 2).map((month, i) => makeCalendarMonth(month, { from: midMonthJoinedOn, seed: i }));
export const midMonthCalendar = {
  months: midMonthMonths,
  hasMore: false,
  ...totals(midMonthMonths),
  last: { ...lastVisit, checkedInAt: at(-1, 6, 40), day: daysFromToday(-1) },
} satisfies MemberCalendar;

/** Signed up three days ago and hasn't been in yet. */
export const newMemberJoinedOn = daysFromToday(-3);
export const newMemberCalendar = {
  months: [{ month: TODAY.slice(0, 7), visits: 0, days: {} }],
  hasMore: false,
  total: 0,
  thisMonth: 0,
  last: null,
} satisfies MemberCalendar;

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function makeSeries(day: string, range: Range): SeriesPoint[] {
  const spec = RANGES.find((r) => r.value === range) ?? RANGES[1];
  if (spec.unit === "month") {
    return lastMonths(day, 12).map((key, i) => {
      const members = 38 + ((i * 11) % 17);
      return { key, label: key, members, visits: members * 14 + ((i * 37) % 60) };
    });
  }
  return eachDay(addDays(day, -(spec.days - 1)), day).map((key, i) => {
    const sunday = new Date(`${key}T00:00:00Z`).getUTCDay() === 0;
    const members = sunday ? 0 : 12 + ((i * 7) % 11);
    return { key, label: key, members, visits: members === 0 ? 0 : members + ((i * 5) % 6) };
  });
}

const BY_HOUR = [0, 0, 0, 0, 0, 0, 34, 61, 48, 22, 9, 4, 6, 8, 3, 2, 7, 26, 39, 30, 12, 0, 0, 0];

function regular(member: KioskMember, visits: number, lastDays: number): RegularRow {
  return { member: { id: member.id, firstName: member.firstName, lastName: member.lastName, serialNo: member.serialNo }, visits, lastDay: daysFromToday(lastDays) };
}

function notSeen(member: KioskMember, lastDays: number | null, mobile: string | null = "98400 12345"): NotSeenRow {
  return {
    member: { id: member.id, firstName: member.firstName, lastName: member.lastName, serialNo: member.serialNo, mobile },
    packageName: member.packageName,
    lastDay: lastDays === null ? null : daysFromToday(lastDays),
    daysSince: lastDays === null ? null : -lastDays,
  };
}

export const regulars: RegularRow[] = [
  regular(m(0), 29, 0),
  regular(m(2), 26, 0),
  regular(m(4), 24, -1),
  regular(m(6), 21, 0),
  regular(m(9), 18, -2),
];

/** Ten on a package who haven't been in, so the card shows its "and 2 more" line. */
export const notSeenRows: NotSeenRow[] = [
  notSeen(m(3), -8, "98400 39012"),
  notSeen(m(5), -9, null),
  notSeen(m(7), -11, "99620 18890"),
  notSeen(m(10), -12, "94440 27432"),
  notSeen(m(11), -15, "98840 12290"),
  notSeen(m(12), -21, "97890 09981"),
  notSeen(m(13), -30, "90030 64521"),
  notSeen(m(1), null, "98410 57781"),
  notSeen(m(8), -45, "98400 01203"),
  notSeen(m(9), -60, "98450 66655"),
];

/**
 * What the attendance page shows for `day` and `range`. Pass it to
 * `mocked(getAttendanceDashboard).mockImplementation(...)` so a story's
 * searchParams pick the day and range the way the real query does.
 */
export function makeDashboard(day: string = TODAY, range: Range = "30d"): AttendanceDashboard {
  const spec = RANGES.find((r) => r.value === range) ?? RANGES[1];
  const series = makeSeries(day, range);
  const log = day === TODAY ? todayRows : day === daysFromToday(-1) ? busyDayRows : busyDayRows.map((row) => ({ ...row, day }));
  const byPeriod: Record<Period, number> = { morning: 0, afternoon: 0, evening: 0 };
  for (const row of log) byPeriod[row.period] += 1;
  return {
    day,
    range,
    rangeFrom: spec.unit === "month" ? `${lastMonths(day, 12)[0]}-01` : addDays(day, -(spec.days - 1)),
    rangeTo: day,
    today: { visits: log.length, members: new Set(log.map((r) => r.memberId)).size, byPeriod },
    yesterday: { visits: 21 },
    month: { visits: 186, members: 41, daysWithVisits: 8, perDay: 23.3 },
    series,
    byHour: BY_HOUR,
    byWeekday: [74, 68, 71, 66, 70, 52, 0],
    regulars,
    notSeen: notSeenRows,
    log,
  };
}

/** A brand-new branch: nothing recorded yet. */
export function makeEmptyDashboard(day: string = TODAY, range: Range = "30d"): AttendanceDashboard {
  const full = makeDashboard(day, range);
  return {
    ...full,
    today: { visits: 0, members: 0, byPeriod: { morning: 0, afternoon: 0, evening: 0 } },
    yesterday: { visits: 0 },
    month: { visits: 0, members: 0, daysWithVisits: 0, perDay: 0 },
    series: full.series.map((p) => ({ ...p, visits: 0, members: 0 })),
    byHour: BY_HOUR.map(() => 0),
    byWeekday: [0, 0, 0, 0, 0, 0, 0],
    regulars: [],
    notSeen: [],
    log: [],
  };
}

export const dailySeries: SeriesPoint[] = makeSeries(TODAY, "30d");
export const twoWeekSeries: SeriesPoint[] = makeSeries(TODAY, "14d");
export const quarterSeries: SeriesPoint[] = makeSeries(TODAY, "90d");
export const monthlySeries: SeriesPoint[] = makeSeries(TODAY, "12m");
export const byHour: number[] = BY_HOUR;
export const byWeekday: number[] = [74, 68, 71, 66, 70, 52, 0];
