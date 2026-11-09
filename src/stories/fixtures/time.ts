/**
 * Every fixture is written against this day so stories render the same on
 * every run. Components take `today` as a prop; pass `TODAY`.
 */
export const TODAY = "2026-11-09";

/** A fixed "now" on `TODAY`, 10:30 India time. */
export const NOW = new Date("2026-11-09T05:00:00.000Z");

/** `TODAY` shifted by `days` (negative for the past), as YYYY-MM-DD. */
export function daysFromToday(days: number): string {
  const d = new Date(`${TODAY}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** A timestamp `days` from `NOW` at the given India-time hour and minute. */
export function at(days: number, hour: number, minute = 0): Date {
  const d = new Date(`${daysFromToday(days)}T00:00:00.000Z`);
  d.setUTCMinutes(hour * 60 + minute - 330);
  return d;
}
