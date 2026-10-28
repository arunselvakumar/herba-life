import "server-only";

import { eq } from "drizzle-orm";
import type { Database } from "@/db";
import { db } from "@/db";
import { member, memberCheckin, memberPackage, packagePlan, type PackagePlan } from "@/db/schema";
import type { FormState } from "./form-state";
import { packageEndDate } from "./dates";
import type { FieldErrors, IntakeInput, MeasurementsInput } from "./validation";

/**
 * The enrolment steps shared by "New member" and "Convert inquiry": insert
 * the member, the optional baseline follow-up and the optional first package.
 */

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

export function hasAnyMeasurement(m: MeasurementsInput): boolean {
  return Object.values(m).some((v) => v !== null && v !== undefined);
}

export function invalid(errors: FieldErrors): FormState {
  return { status: "error", message: "Please fix the highlighted fields.", errors };
}

/** Resolve the chosen catalog plan; archived plans cannot be used for new enrolments. */
export async function activePlan(planId: string, prefix = ""): Promise<PackagePlan | FormState> {
  const plan = await db.query.packagePlan.findFirst({ where: eq(packagePlan.id, planId) });
  if (!plan || !plan.isActive) {
    return invalid({ [`${prefix}planId`]: ["That package is no longer available. Pick another."] });
  }
  return plan;
}

export function enrolmentValues(
  plan: PackagePlan,
  input: { extraDays: number | null; startDate: string; amountPaid: number | null; notes: string | null },
) {
  const extraDays = input.extraDays ?? 0;
  return {
    planId: plan.id,
    name: plan.name,
    durationDays: plan.durationDays,
    extraDays,
    startDate: input.startDate,
    endDate: packageEndDate(input.startDate, plan.durationDays, extraDays),
    price: plan.price,
    amountPaid: input.amountPaid ?? 0,
    notes: input.notes,
  };
}

/** Insert the member record (and baseline / package) inside `tx`; returns the new member id. */
export async function insertMember(
  tx: Tx,
  input: IntakeInput,
  plan: PackagePlan | null,
  userId: string,
  baselineRemark = "Baseline at enrolment",
): Promise<string> {
  const { baseline, package: pkg, lastName, ...details } = input;

  const [created] = await tx
    .insert(member)
    .values({ ...details, lastName: lastName ?? "", createdBy: userId })
    .returning({ id: member.id });
  if (!created) throw new Error("Insert failed");

  if (hasAnyMeasurement(baseline)) {
    await tx.insert(memberCheckin).values({
      ...baseline,
      memberId: created.id,
      recordedOn: details.joinedOn,
      remarks: baselineRemark,
      recordedBy: userId,
    });
  }

  if (pkg && plan) {
    await tx.insert(memberPackage).values({
      ...enrolmentValues(plan, pkg),
      memberId: created.id,
      createdBy: userId,
    });
  }
  return created.id;
}
