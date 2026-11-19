import "server-only";

import { eq } from "drizzle-orm";
import { after } from "next/server";
import type { Database } from "@/db";
import { db } from "@/db";
import { member, memberCheckin, memberPackage, packagePlan, type PackagePlan } from "@/db/schema";
import { packageConfirmationMessage, welcomeMessage } from "@/lib/whatsapp/messages";
import { sendWhatsApp } from "@/lib/whatsapp/send";
import type { FormState } from "./form-state";
import { packageEndDate, today } from "./dates";
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

/** Insert the member record (and baseline / package) inside `tx`; returns the new member's id and serial number. */
export async function insertMember(
  tx: Tx,
  input: IntakeInput,
  plan: PackagePlan | null,
  userId: string,
  baselineRemark = "Baseline at enrolment",
): Promise<{ id: string; serialNo: number }> {
  const { baseline, package: pkg, lastName, ...details } = input;

  const [created] = await tx
    .insert(member)
    .values({ ...details, lastName: lastName ?? "", createdBy: userId })
    .returning({ id: member.id, serialNo: member.serialNo });
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
  return created;
}

/**
 * Welcome a member on WhatsApp once their enrolment is saved, so call this
 * after the transaction, never inside it. Only someone who joined today is
 * welcomed: a record typed in later from the paper sheets carries its own
 * earlier date, and that member joined long ago.
 */
export function welcomeMember(created: { id: string; serialNo: number }, input: Pick<IntakeInput, "firstName" | "mobile" | "joinedOn">) {
  if (input.joinedOn !== today()) return;
  after(() =>
    sendWhatsApp({
      memberId: created.id,
      mobile: input.mobile,
      message: welcomeMessage({ firstName: input.firstName, serialNo: created.serialNo, joinedOn: input.joinedOn }),
    }),
  );
}

/**
 * Confirm a package added to an enrolled member on WhatsApp, once it is
 * saved. A package that has already ended is history being filled in, and
 * gets nothing.
 */
export function confirmPackage(memberId: string, pkg: { name: string; startDate: string; endDate: string }) {
  if (pkg.endDate < today()) return;
  after(async () => {
    const found = await db.query.member.findFirst({
      where: eq(member.id, memberId),
      columns: { firstName: true, mobile: true },
    });
    if (!found) return;
    await sendWhatsApp({
      memberId,
      mobile: found.mobile,
      message: packageConfirmationMessage({
        firstName: found.firstName,
        packageName: pkg.name,
        startDate: pkg.startDate,
        endDate: pkg.endDate,
      }),
    });
  });
}
