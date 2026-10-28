import { REFERENCE, type MeasurementKey } from "./constants";
import { today, daysBetween, ageOn } from "./dates";

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

export type PackageLike = {
  status: "active" | "completed" | "cancelled";
  startDate: string;
  endDate: string;
};

export type PackageState = "upcoming" | "active" | "expiring" | "expired" | "completed" | "cancelled";

export function packageState(pkg: PackageLike, expiringWithinDays: number, on: string = today()): PackageState {
  if (pkg.status !== "active") return pkg.status;
  if (pkg.startDate > on) return "upcoming";
  const left = daysBetween(on, pkg.endDate);
  if (left < 0) return "expired";
  if (left <= expiringWithinDays) return "expiring";
  return "active";
}

export function daysLeft(pkg: PackageLike, on: string = today()): number {
  return daysBetween(on, pkg.endDate);
}
