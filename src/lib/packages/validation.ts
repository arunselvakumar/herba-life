import { z } from "zod";

const blankToNull = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? null : value;

export const planSchema = z.object({
  name: z.string().trim().min(1, "Give the package a name").max(80),
  durationDays: z.coerce.number().int().min(1, "At least one day").max(3650),
  price: z.preprocess(blankToNull, z.coerce.number().min(0).max(10_000_000).nullable()).default(null),
  description: z.preprocess(blankToNull, z.string().trim().max(500).nullable()).default(null),
  sortOrder: z.preprocess(blankToNull, z.coerce.number().int().min(0).max(1000).nullable()).default(null),
});
export type PlanInput = z.infer<typeof planSchema>;
