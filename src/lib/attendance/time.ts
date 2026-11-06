import { addDays, branchAsUtc, branchClock, parseDay, toDay } from "@/lib/members/dates";
import { AFTERNOON_STARTS_AT, BRANCH_TIME_ZONE, EVENING_STARTS_AT, type Period } from "./constants";

/** Which part of the day a visit at this instant belongs to, on the branch's clock. */
export function periodFor(date: Date): Period {
  const { hour } = branchClock(date);
  if (hour < AFTERNOON_STARTS_AT) return "morning";
  if (hour < EVENING_STARTS_AT) return "afternoon";
  return "evening";
}

const timeFormat = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: BRANCH_TIME_ZONE });

// These format calendar days from `parseDay`, midnight in the runtime's zone, so
// they stay in that zone. The branch's zone would show the day before east of it.
const weekdayFormat = new Intl.DateTimeFormat("en-IN", { weekday: "long" });
const shortDayFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const monthFormat = new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" });
const longDateFormat = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const compactDateFormat = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

/** "9:14 am" at the branch. */
export function formatTime(date: Date): string {
  return timeFormat.format(date).toLowerCase();
}

/** "Tuesday" */
export function formatWeekday(day: string): string {
  return weekdayFormat.format(parseDay(day));
}

/** "28 Oct" */
export function formatShortDay(day: string): string {
  return shortDayFormat.format(parseDay(day));
}

/** "Oct 26" for a `YYYY-MM` key. */
export function formatMonth(month: string): string {
  return monthFormat.format(parseDay(`${month}-01`));
}

/** "Tuesday, 28 October 2026" */
export function formatLongDate(day: string): string {
  return longDateFormat.format(parseDay(day));
}

/** "Tue, 28 Oct 2026" */
export function formatCompactDate(day: string): string {
  return compactDateFormat.format(parseDay(day));
}

/** "Today", "Yesterday" or the formatted day. */
export function relativeDay(day: string, today: string): string {
  if (day === today) return "Today";
  if (day === addDays(today, -1)) return "Yesterday";
  return formatShortDay(day);
}

/** Every day from `from` to `to` inclusive, oldest first. */
export function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  return days;
}

/** The `YYYY-MM` keys for the `count` months ending with the month of `today`, oldest first. */
export function lastMonths(today: string, count: number): string[] {
  const [y, m] = today.split("-").map(Number);
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(y ?? 1970, (m ?? 1) - 1 - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

export function monthKey(day: string): string {
  return day.slice(0, 7);
}

/** The instant a `YYYY-MM-DD` day and `HH:MM` time on the branch's clock refer to. */
export function combineDayAndTime(day: string, time: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const wall = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, h ?? 0, min ?? 0));
  const offset = branchAsUtc(wall).getTime() - wall.getTime();
  return new Date(wall.getTime() - offset);
}

/** Day of the week at the branch at this instant, Monday first. */
export function weekdayIndex(date: Date): number {
  return (parseDay(toDay(date)).getDay() + 6) % 7;
}

export { toDay };
