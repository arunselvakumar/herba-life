import { REFERENCE, type MeasurementKey } from "./constants";
import { today, ageOn } from "./dates";

export const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return currency.format(value);
}

export function formatNumber(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(digits);
}

export function fullName(member: { firstName: string; lastName: string }): string {
  return [member.firstName, member.lastName].filter(Boolean).join(" ");
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function displayAge(member: { dateOfBirth: string | null; age: number | null }): number | null {
  if (member.dateOfBirth) return ageOn(member.dateOfBirth);
  return member.age;
}

export function computeBmi(weightKg: number, heightCm: number): number {
  const metres = heightCm / 100;
  return Math.round((weightKg / (metres * metres)) * 10) / 10;
}

export type RangeVerdict = "low" | "ok" | "high" | null;

/**
 * Compare a measurement with the reference ranges printed on the paper
 * record. Returns null when there is no range for that measurement.
 */
export function rangeVerdict(
  key: MeasurementKey,
  value: number | null | undefined,
  gender: "male" | "female" | "other" | null,
): RangeVerdict {
  if (value === null || value === undefined) return null;
  const sex = gender === "female" ? "female" : gender === "male" ? "male" : null;
  let range: readonly [number, number] | null = null;
  switch (key) {
    case "bodyFatPct":
      range = sex ? REFERENCE.bodyFatPct[sex] : null;
      break;
    case "bmi":
      range = REFERENCE.bmi;
      break;
    case "visceralFat":
      range = REFERENCE.visceralFat;
      break;
    case "bmr":
      range = REFERENCE.bmr;
      break;
    case "waistCm":
      return sex ? (value > REFERENCE.waistCm[sex] ? "high" : "ok") : null;
    default:
      return null;
  }
  if (!range) return null;
  if (value < range[0]) return "low";
  if (value > range[1]) return "high";
  return "ok";
}

/**
 * A package is a number of visits, not a stretch of the calendar. It has a
 * first day but no last one: it is over when its visits have been used.
 */
export type PackageLike = {
  status: "active" | "completed" | "cancelled";
  startDate: string;
  visits: number;
  extraVisits: number;
  visitsUsed: number;
};

type VisitCount = Pick<PackageLike, "visits" | "extraVisits" | "visitsUsed">;

export function visitsTotal(pkg: Pick<PackageLike, "visits" | "extraVisits">): number {
  return pkg.visits + pkg.extraVisits;
}

export function visitsLeft(pkg: VisitCount): number {
  return Math.max(visitsTotal(pkg) - pkg.visitsUsed, 0);
}

/** "1 visit left", "12 visits left", "No visits left". */
export function describeVisitsLeft(left: number): string {
  if (left <= 0) return "No visits left";
  return `${left} visit${left === 1 ? "" : "s"} left`;
}

/**
 * `low` is a package still in use with few visits left; `used_up` is one
 * nobody has closed whose visits are all gone.
 */
export type PackageState = "upcoming" | "active" | "low" | "used_up" | "completed" | "cancelled";

export const PACKAGE_STATE_LABELS: Record<PackageState, string> = {
  upcoming: "Upcoming",
  active: "Active",
  low: "Few visits left",
  used_up: "Used up",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function packageState(pkg: PackageLike, lowAtVisits: number, on: string = today()): PackageState {
  if (pkg.status !== "active") return pkg.status;
  const left = visitsLeft(pkg);
  if (left === 0) return "used_up";
  if (pkg.startDate > on) return "upcoming";
  if (left <= lowAtVisits) return "low";
  return "active";
}

/** Whether a visit can be taken from this package on `on`. */
export function isUsable(pkg: PackageLike, on: string = today()): boolean {
  return pkg.status === "active" && pkg.startDate <= on && visitsLeft(pkg) > 0;
}

/**
 * The package that matters right now: the one visits are being taken from,
 * which is the oldest open package that has started and has visits left.
 * Failing that, one still to start, then the most recent of any status so a
 * list can show "used up" or "cancelled".
 */
export function pickCurrentPackage<T extends PackageLike & { createdAt: Date }>(packages: readonly T[], on: string = today()): T | null {
  const newestFirst = [...packages].sort((a, b) => b.startDate.localeCompare(a.startDate) || b.createdAt.getTime() - a.createdAt.getTime());
  const active = newestFirst.filter((p) => p.status === "active");
  const inUse = active.findLast((p) => isUsable(p, on));
  const upcoming = active.findLast((p) => visitsLeft(p) > 0);
  return inUse ?? upcoming ?? active[0] ?? newestFirst[0] ?? null;
}
