"use server";

import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { memberPackage, packagePlan } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import type { FormState } from "@/lib/members/form-state";
import { UUID_RE } from "@/lib/members/form-defaults";
import { flattenErrors, formDataToObject } from "@/lib/members/validation";
import { planSchema } from "./validation";

function assertId(id: string): string {
  if (!UUID_RE.test(id)) throw new Error("Invalid id");
  return id;
}

function revalidate() {
  revalidatePath("/packages");
  revalidatePath("/members/new");
  revalidatePath("/members");
}

export async function createPlan(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const parsed = planSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: flattenErrors(parsed.error) };
  }
  const { sortOrder, ...rest } = parsed.data;
  await db.insert(packagePlan).values({ ...rest, sortOrder: sortOrder ?? 0, createdBy: user.id });
  revalidate();
  redirect("/packages");
}

export async function updatePlan(planId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = assertId(planId);
  const parsed = planSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: flattenErrors(parsed.error) };
  }
  const { sortOrder, ...rest } = parsed.data;
  const [updated] = await db
    .update(packagePlan)
    .set({ ...rest, sortOrder: sortOrder ?? 0 })
    .where(eq(packagePlan.id, id))
    .returning({ id: packagePlan.id });
  if (!updated) return { status: "error", message: "This package no longer exists.", errors: {} };
  revalidate();
  redirect("/packages");
}

export async function setPlanActive(planId: string, isActive: boolean): Promise<void> {
  await requireAdmin();
  await db.update(packagePlan).set({ isActive }).where(eq(packagePlan.id, assertId(planId)));
  revalidate();
}

/** Only packages nobody has ever been enrolled in can be deleted; archive the rest. */
export async function deletePlan(planId: string): Promise<void> {
  await requireAdmin();
  const id = assertId(planId);
  const [used] = await db.select({ value: count() }).from(memberPackage).where(eq(memberPackage.planId, id));
  if ((used?.value ?? 0) > 0) {
    throw new Error("This package has enrolments. Archive it instead.");
  }
  await db.delete(packagePlan).where(eq(packagePlan.id, id));
  revalidate();
}
