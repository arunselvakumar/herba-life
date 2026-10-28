"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { member, memberCheckin, memberPackage } from "@/db/schema";
import { requireUser } from "@/lib/session";
import type { FormState } from "./form-state";
import { activePlan, enrolmentValues, hasAnyMeasurement, insertMember, invalid } from "./intake";
import {
  checkinSchema,
  memberSchema,
  flattenErrors,
  formDataToObject,
  intakeSchema,
  packageSchema,
  packageStatusSchema,
} from "./validation";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertId(id: string): string {
  if (!UUID.test(id)) throw new Error("Invalid id");
  return id;
}

export async function createMember(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = intakeSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(flattenErrors(parsed.error));

  const pkg = parsed.data.package;
  const plan = pkg ? await activePlan(pkg.planId, "package.") : null;
  if (plan && "status" in plan) return plan;

  const id = await db.transaction((tx) => insertMember(tx, parsed.data, plan, user.id));

  revalidatePath("/members");
  revalidatePath("/dashboard");
  redirect(`/members/${id}`);
}

export async function updateMember(memberId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const id = assertId(memberId);
  const parsed = memberSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(flattenErrors(parsed.error));

  const { lastName, ...details } = parsed.data;
  const [updated] = await db
    .update(member)
    .set({ ...details, lastName: lastName ?? "" })
    .where(eq(member.id, id))
    .returning({ id: member.id });
  if (!updated) return { status: "error", message: "This member no longer exists.", errors: {} };

  revalidatePath("/members");
  revalidatePath(`/members/${id}`);
  revalidatePath("/dashboard");
  redirect(`/members/${id}`);
}

export async function deleteMember(memberId: string): Promise<void> {
  await requireUser();
  const id = assertId(memberId);
  await db.delete(member).where(eq(member.id, id));
  revalidatePath("/members");
  revalidatePath("/inquiries");
  revalidatePath("/dashboard");
  redirect("/members");
}

export async function addCheckin(memberId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = assertId(memberId);
  const parsed = checkinSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(flattenErrors(parsed.error));

  const { recordedOn, remarks, ...measurements } = parsed.data;
  if (!hasAnyMeasurement(measurements) && !remarks) {
    return invalid({ _form: ["Enter at least one measurement or a remark."] });
  }

  await db.insert(memberCheckin).values({
    ...measurements,
    memberId: id,
    recordedOn,
    remarks,
    recordedBy: user.id,
  });

  revalidatePath(`/members/${id}`);
  revalidatePath("/members");
  revalidatePath("/dashboard");
  return { status: "success", message: "Follow-up recorded." };
}

export async function deleteCheckin(memberId: string, checkinId: string): Promise<void> {
  await requireUser();
  const id = assertId(memberId);
  await db
    .delete(memberCheckin)
    .where(and(eq(memberCheckin.id, assertId(checkinId)), eq(memberCheckin.memberId, id)));
  revalidatePath(`/members/${id}`);
  revalidatePath("/members");
  revalidatePath("/dashboard");
}

export async function createPackage(memberId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = assertId(memberId);
  const parsed = packageSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(flattenErrors(parsed.error));

  const plan = await activePlan(parsed.data.planId);
  if ("status" in plan) return plan;

  await db.insert(memberPackage).values({
    ...enrolmentValues(plan, parsed.data),
    memberId: id,
    createdBy: user.id,
  });

  revalidatePath(`/members/${id}`);
  revalidatePath("/members");
  revalidatePath("/dashboard");
  redirect(`/members/${id}`);
}

export async function setPackageStatus(memberId: string, packageId: string, status: string): Promise<void> {
  await requireUser();
  const id = assertId(memberId);
  const parsedStatus = packageStatusSchema.parse(status);
  await db
    .update(memberPackage)
    .set({ status: parsedStatus })
    .where(and(eq(memberPackage.id, assertId(packageId)), eq(memberPackage.memberId, id)));
  revalidatePath(`/members/${id}`);
  revalidatePath("/members");
  revalidatePath("/dashboard");
}

export async function deletePackage(memberId: string, packageId: string): Promise<void> {
  await requireUser();
  const id = assertId(memberId);
  await db
    .delete(memberPackage)
    .where(and(eq(memberPackage.id, assertId(packageId)), eq(memberPackage.memberId, id)));
  revalidatePath(`/members/${id}`);
  revalidatePath("/members");
  revalidatePath("/dashboard");
}
