import { z } from "zod";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const blankToNull = (value: unknown) => (typeof value === "string" && value.trim() === "" ? null : value);

export const memberIdSchema = z.string().regex(UUID, "Choose a member");

export const dayField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date");
const timeField = z.string().regex(/^\d{2}:\d{2}$/, "Enter a valid time");

/** Staff recording a visit by hand (forgot to tap, tablet was down, …). */
export const manualAttendanceSchema = z.object({
  memberId: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), memberIdSchema),
  day: dayField,
  time: timeField,
  note: z.preprocess(blankToNull, z.string().trim().max(500).nullable()).default(null),
});
export type ManualAttendanceInput = z.infer<typeof manualAttendanceSchema>;

export const exitPasswordSchema = z.string().min(1, "Enter your password").max(128);

export type FieldErrors = Record<string, string[] | undefined>;

export function flattenErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_form";
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}

export function formDataToObject(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$ACTION")) continue;
    result[key] = value;
  }
  return result;
}
