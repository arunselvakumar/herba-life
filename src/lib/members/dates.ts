import { BRANCH_TIME_ZONE } from "@/lib/attendance/constants";

/**
 * Date helpers for the member module. All "day" values are ISO `YYYY-MM-DD`
 * strings, which is what the Postgres `date` columns round-trip as.
 *
 * Two kinds of `Date` pass through here, and they must not be mixed up, on
 * the server or in a browser, in whatever zone either happens to run:
 *
 * - An instant, such as `new Date()` or `checkedInAt`. Which day or hour that
 *   is depends on where you stand, so it is always read off the branch's
 *   clock: `branchClock`, `toDay`, `today`.
 * - A calendar day held in a `Date`, such as `parseDay` or a date picker's
 *   value: midnight in the runtime's own zone. It is read back in that same
 *   zone with `calendarDay`, so it stays the day it was. Reading one with
 *   `toDay` gives the day before anywhere east of the branch.
 */

const DAY_MS = 86_400_000;

const branchFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: BRANCH_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

/** What a clock on the branch's wall reads at this instant. `month` is 1–12. */
export function branchClock(date: Date) {
  const parts = branchFormat.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: part("year"),
    month: part("month"),
    day: part("day"),
    hour: part("hour"),
    minute: part("minute"),
    second: part("second"),
  };
}

/** The branch's wall clock at this instant, as if it were UTC. Subtract the instant to get the branch's offset. */
export function branchAsUtc(date: Date): Date {
  const { year, month, day, hour, minute, second } = branchClock(date);
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

function isoDay(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** The day it is at the branch at this instant. */
export function toDay(date: Date): string {
  const { year, month, day } = branchClock(date);
  return isoDay(year, month, day);
}

/** The day held in a `parseDay` or date picker value. Not for instants: see the note above. */
export function calendarDay(date: Date): string {
  return isoDay(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function today(): string {
  return toDay(new Date());
}

export function parseDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(day: string, days: number): string {
  const date = parseDay(day);
  date.setDate(date.getDate() + days);
  return calendarDay(date);
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / DAY_MS);
}

export function ageOn(dateOfBirth: string, on: string = today()): number {
  const dob = parseDay(dateOfBirth);
  const ref = parseDay(on);
  let age = ref.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    ref.getMonth() < dob.getMonth() ||
    (ref.getMonth() === dob.getMonth() && ref.getDate() < dob.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/** Last covered day of a package. A 30-day package starting on the 1st ends on the 30th. */
export function packageEndDate(startDate: string, durationDays: number, extraDays = 0): string {
  return addDays(startDate, durationDays + extraDays - 1);
}

const longDate = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatDay(day: string | null | undefined): string {
  if (!day) return "—";
  return longDate.format(parseDay(day));
}
