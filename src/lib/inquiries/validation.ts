import { z } from "zod";
import {
  healthSchema,
  habitsSchema,
  measurementsSchema,
  personSchema,
  optionalDay,
  optionalText,
  optionalNumber,
  optionalUuid,
  day,
  enumValues,
  stringList,
} from "@/lib/members/validation";
import { ACTIVITY_TYPES, GOALS, INQUIRY_SOURCES } from "./constants";

/** Everything on the inquiry form. Only the first name is required. */
export const inquirySchema = personSchema.extend({
  inquiredOn: day,
  source: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.enum(enumValues(INQUIRY_SOURCES), { error: "Choose where the inquiry came from" }),
  ),
  preferredContactTime: optionalText(120),
  referredByMemberId: optionalUuid,
  assignedTo: optionalText(120),
  goals: stringList(GOALS),
  goalNotes: optionalText(2000),
  interestedPlanId: optionalUuid,
  heightCm: optionalNumber(30, 300),
  ...measurementsSchema.shape,
  ...habitsSchema.shape,
  ...healthSchema.shape,
  remarks: optionalText(2000),
  nextFollowUpOn: optionalDay,
});
export type InquiryInput = z.infer<typeof inquirySchema>;

export const activitySchema = z.object({
  type: z.enum(enumValues(ACTIVITY_TYPES), { error: "Choose what happened" }),
  occurredOn: day,
  notes: optionalText(2000),
  nextFollowUpOn: optionalDay,
});
export type ActivityInput = z.infer<typeof activitySchema>;

export const lostSchema = z.object({
  lostReason: z.string().trim().min(1, "Say why, briefly, so the next person knows").max(500),
});
export type LostInput = z.infer<typeof lostSchema>;
