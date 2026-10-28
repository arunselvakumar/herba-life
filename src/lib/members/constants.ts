/**
 * Shared vocabulary for the member module. Safe to import from member
 * components: no server-only code lives here.
 */

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;
export type Gender = (typeof GENDERS)[number]["value"];

export const DIETS = [
  { value: "veg", label: "Vegetarian" },
  { value: "non_veg", label: "Non-vegetarian" },
  { value: "eggetarian", label: "Eggetarian" },
] as const;
export type Diet = (typeof DIETS)[number]["value"];

/** Health complaints listed on the paper intake sheet. */
export const SYMPTOMS = [
  { value: "tiredness", label: "Tiredness" },
  { value: "headache", label: "Headache" },
  { value: "giddiness", label: "Giddiness" },
  { value: "gastritis", label: "Gastritis" },
  { value: "acidity", label: "Acidity" },
  { value: "indigestion", label: "Indigestion" },
  { value: "constipation", label: "Constipation" },
  { value: "pain", label: "Pain" },
  { value: "breathing_problem", label: "Breathing problem" },
  { value: "sleeping_disorder", label: "Sleeping disorder" },
] as const;
export type Symptom = (typeof SYMPTOMS)[number]["value"];

export const PAIN_AREAS = [
  { value: "body", label: "Body" },
  { value: "shoulder", label: "Shoulder" },
  { value: "neck", label: "Neck" },
  { value: "back", label: "Back" },
  { value: "knee", label: "Knee" },
  { value: "heel", label: "Heel" },
] as const;
export type PainArea = (typeof PAIN_AREAS)[number]["value"];

export const PACKAGE_STATUSES = ["active", "completed", "cancelled"] as const;
export type PackageStatus = (typeof PACKAGE_STATUSES)[number];

/**
 * Reference ranges printed on the paper wellness record. Used purely as
 * visual hints next to measurements; nothing is enforced.
 */
export const REFERENCE = {
  bodyFatPct: { male: [10, 20], female: [20, 30] },
  bmi: [21, 24],
  visceralFat: [7, 9],
  bmr: [1400, 1500],
  waistCm: { male: 80, female: 90 },
} as const;

export type MeasurementKey =
  | "weightKg"
  | "bodyFatPct"
  | "bmi"
  | "visceralFat"
  | "bmr"
  | "bodyAge"
  | "muscleMassPct"
  | "waistCm";

export const MEASUREMENTS: readonly {
  key: MeasurementKey;
  label: string;
  short: string;
  unit: string;
  step: string;
  hint?: string;
}[] = [
  { key: "weightKg", label: "Weight", short: "Weight", unit: "kg", step: "0.1" },
  { key: "bodyFatPct", label: "Body fat", short: "Fat", unit: "%", step: "0.1", hint: "M 10–20 · F 20–30" },
  { key: "bmi", label: "BMI", short: "BMI", unit: "kg/m²", step: "0.1", hint: "Ref 21–24" },
  { key: "visceralFat", label: "Visceral fat", short: "VF", unit: "", step: "0.5", hint: "Ref 7–9" },
  { key: "bmr", label: "BMR", short: "BMR", unit: "kcal", step: "1", hint: "Ref 1400–1500" },
  { key: "bodyAge", label: "Body age", short: "BA", unit: "yrs", step: "1" },
  { key: "muscleMassPct", label: "Muscle mass", short: "MM", unit: "%", step: "0.1" },
  { key: "waistCm", label: "Waist line", short: "WL", unit: "cm", step: "0.5", hint: "M 80 · F 90" },
];

/** How long a member may go without a follow-up before the dashboard flags them. */
export const FOLLOW_UP_INTERVAL_DAYS = 30;
/** Packages ending within this window show up as "expiring soon". */
export const EXPIRING_SOON_DAYS = 14;
