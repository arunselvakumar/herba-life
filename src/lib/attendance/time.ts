import { addDays, parseDay, toDay } from "@/lib/members/dates";
import { AFTERNOON_STARTS_AT, EVENING_STARTS_AT, type Period } from "./constants";

/** Which part of the day a visit at this local time belongs to. */
export function periodFor(date: Date): Period {
  const hour = date.getHours();
  if (hour < AFTERNOON_STARTS_AT) return "morning";
  if (hour < EVENING_STARTS_AT) return "afternoon";
  return "evening";
}

const timeFormat = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });
const weekdayFormat = new Intl.DateTimeFormat("en-IN", { weekday: "long" });
const shortDayFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const monthFormat = new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" });
const longDateFormat = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** "9:14 am" */
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

/** Combine a `YYYY-MM-DD` day and a `HH:MM` time into a local Date. */
export function combineDayAndTime(day: string, time: string): Date {
  const date = parseDay(day);
  const [h, min] = time.split(":").map(Number);
  date.setHours(h ?? 0, min ?? 0, 0, 0);
  return date;
}

export { toDay };
