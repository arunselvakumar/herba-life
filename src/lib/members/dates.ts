/**
 * Date helpers for the member module. All "day" values are ISO `YYYY-MM-DD`
 * strings, which is what the Postgres `date` columns round-trip as.
 */

const DAY_MS = 86_400_000;

export function toDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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
  return toDay(date);
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
