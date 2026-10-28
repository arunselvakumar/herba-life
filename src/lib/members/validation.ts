import { z } from "zod";
import { DIETS, GENDERS, PACKAGE_STATUSES, PAIN_AREAS, SYMPTOMS } from "./constants";

export const blankToNull = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? null : value;

export const optionalText = (max = 500) =>
  z.preprocess(blankToNull, z.string().trim().max(max).nullable()).default(null);

export const optionalNumber = (min: number, max: number) =>
  z.preprocess(blankToNull, z.coerce.number().min(min).max(max).nullable()).default(null);

export const optionalInt = (min: number, max: number) =>
  z.preprocess(blankToNull, z.coerce.number().int().min(min).max(max).nullable()).default(null);

export const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date");
export const optionalDay = z.preprocess(blankToNull, day.nullable()).default(null);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const optionalUuid = z.preprocess(blankToNull, z.string().regex(UUID_RE, "Pick one from the list").nullable()).default(null);

export const checkbox = z.preprocess((value) => value === "on" || value === "true" || value === true, z.boolean());

export const enumValues = <T extends readonly { value: string }[]>(list: T) =>
  list.map((item) => item.value) as [T[number]["value"], ...T[number]["value"][]];

export const stringList = <T extends readonly { value: string }[]>(list: T) =>
  z.array(z.enum(enumValues(list))).default([]);

export const measurementsSchema = z.object({
  weightKg: optionalNumber(1, 500),
  bodyFatPct: optionalNumber(0, 100),
  bmi: optionalNumber(1, 100),
  visceralFat: optionalNumber(0, 60),
  bmr: optionalInt(100, 10000),
  bodyAge: optionalInt(1, 150),
  muscleMassPct: optionalNumber(0, 100),
  waistCm: optionalNumber(10, 400),
});
export type MeasurementsInput = z.infer<typeof measurementsSchema>;

export const checkinSchema = measurementsSchema.extend({
  recordedOn: day,
  remarks: optionalText(2000),
});
export type CheckinInput = z.infer<typeof checkinSchema>;

const planId = z
  .string({ error: "Choose a package" })
  .regex(UUID_RE, "Choose a package");

export const packageSchema = z.object({
  planId: z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), planId),
  extraDays: z.preprocess(blankToNull, z.coerce.number().int().min(0).max(3650).nullable()).default(null),
  startDate: day,
  amountPaid: z.preprocess(blankToNull, z.coerce.number().min(0).max(10_000_000).nullable()).default(null),
  notes: optionalText(2000),
});
export type PackageInput = z.infer<typeof packageSchema>;

export const packageStatusSchema = z.enum(PACKAGE_STATUSES);

/**
 * The field groups below mirror the column groups in src/db/record-columns.ts;
 * the member intake form and the inquiry form are both built from them.
 */

export const personSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.preprocess(blankToNull, z.string().trim().max(80).nullable()).default(null),
  gender: z.preprocess(blankToNull, z.enum(enumValues(GENDERS)).nullable()).default(null),
  dateOfBirth: optionalDay,
  age: optionalInt(0, 150),
  mobile: optionalText(40),
  email: z.preprocess(blankToNull, z.string().trim().email("Enter a valid email").nullable()).default(null),
  address: optionalText(1000),
  referredBy: optionalText(120),
});

export const habitsSchema = z.object({
  wakeUpTime: optionalText(120),
  teaCoffee: optionalText(200),
  breakfast: optionalText(300),
  lunch: optionalText(300),
  eveningSnacks: optionalText(300),
  dinner: optionalText(300),
  diet: z.preprocess(blankToNull, z.enum(enumValues(DIETS)).nullable()).default(null),
  waterIntake: optionalText(120),
});

export const healthSchema = z.object({
  hasBloodPressure: checkbox.default(false),
  hasSugar: checkbox.default(false),
  hasCardiac: checkbox.default(false),
  medicines: optionalText(1000),
  symptoms: stringList(SYMPTOMS),
  painAreas: stringList(PAIN_AREAS),
  healthNotes: optionalText(2000),
});

export const memberSchema = personSchema.extend({
  joinedOn: day,
  heightCm: optionalNumber(30, 300),
  ...habitsSchema.shape,
  ...healthSchema.shape,
  remarks: optionalText(2000),
});
export type MemberInput = z.infer<typeof memberSchema>;

/** Intake = member details + optional baseline measurements + optional first package. */
export const intakeSchema = memberSchema.extend({
  baseline: measurementsSchema,
  package: z.preprocess(
    (value) => (value && typeof value === "object" && "enabled" in value && value.enabled ? value : null),
    packageSchema.extend({ enabled: checkbox }).nullable(),
  ).default(null),
});
export type IntakeInput = z.infer<typeof intakeSchema>;

export type FieldErrors = Record<string, string[] | undefined>;

/** Turn a FormData into a plain object; repeated keys become arrays. */
export function formDataToObject(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [rawKey, value] of formData.entries()) {
    if (rawKey.startsWith("$ACTION")) continue;
    const isList = rawKey.endsWith("[]");
    const key = isList ? rawKey.slice(0, -2) : rawKey;
    // Support one level of nesting: "package.name" -> { package: { name } }
    const [head, tail] = key.split(".", 2) as [string, string | undefined];
    if (tail) {
      const nested = (result[head] ??= {}) as Record<string, unknown>;
      nested[tail] = value;
      continue;
    }
    if (isList) {
      const list = (result[key] ??= []) as unknown[];
      list.push(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function flattenErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const path = issue.path.map(String).join(".") || "_form";
    (errors[path] ??= []).push(issue.message);
  }
  return errors;
}
