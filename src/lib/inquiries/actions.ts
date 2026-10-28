"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { inquiry, inquiryActivity, member, packagePlan, user, type Inquiry } from "@/db/schema";
import { requireUser } from "@/lib/session";
import type { FormState } from "@/lib/members/form-state";
import { UUID_RE } from "@/lib/members/form-defaults";
import { today } from "@/lib/members/dates";
import { activePlan, insertMember, invalid } from "@/lib/members/intake";
import { flattenErrors, formDataToObject, intakeSchema, type FieldErrors } from "@/lib/members/validation";
import { CONTACT_ACTIVITY_TYPES, isOpenStatus } from "./constants";
import { activitySchema, inquirySchema, lostSchema, type InquiryInput } from "./validation";

function assertId(id: string): string {
  if (!UUID_RE.test(id)) throw new Error("Invalid id");
  return id;
}

function revalidate(id?: string) {
  revalidatePath("/inquiries");
  if (id) revalidatePath(`/inquiries/${id}`);
  revalidatePath("/dashboard");
}

const GONE: FormState = { status: "error", message: "This inquiry no longer exists.", errors: {} };
const CLOSED: FormState = {
  status: "error",
  message: "This inquiry is closed. Reopen it to make changes.",
  errors: {},
};

type OpenResult = { ok: true; row: Inquiry } | { ok: false; state: FormState };

async function openInquiry(id: string): Promise<OpenResult> {
  const row = await db.query.inquiry.findFirst({ where: eq(inquiry.id, id) });
  if (!row) return { ok: false, state: GONE };
  if (!isOpenStatus(row.status)) return { ok: false, state: CLOSED };
  return { ok: true, row };
}

/** Check the linked records exist and are usable; returns field errors otherwise. */
async function checkLinks(input: InquiryInput): Promise<FieldErrors> {
  const errors: FieldErrors = {};
  const [plan, referrer, staff] = await Promise.all([
    input.interestedPlanId
      ? db.query.packagePlan.findFirst({ where: eq(packagePlan.id, input.interestedPlanId), columns: { isActive: true } })
      : null,
    input.referredByMemberId
      ? db.query.member.findFirst({ where: eq(member.id, input.referredByMemberId), columns: { id: true } })
      : null,
    input.assignedTo ? db.query.user.findFirst({ where: eq(user.id, input.assignedTo), columns: { id: true } }) : null,
  ]);
  if (input.interestedPlanId && !plan) errors.interestedPlanId = ["That package no longer exists."];
  if (input.referredByMemberId && !referrer) errors.referredByMemberId = ["That member no longer exists."];
  if (input.assignedTo && !staff) errors.assignedTo = ["That staff account no longer exists."];
  return errors;
}

function rowValues(input: InquiryInput) {
  const { lastName, ...rest } = input;
  return { ...rest, lastName: lastName ?? "" };
}

export async function createInquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  const currentUser = await requireUser();
  const parsed = inquirySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(flattenErrors(parsed.error));

  const linkErrors = await checkLinks(parsed.data);
  if (Object.keys(linkErrors).length > 0) return invalid(linkErrors);
  // Archived packages stay on old inquiries but cannot be picked for new ones.
  if (parsed.data.interestedPlanId) {
    const plan = await activePlan(parsed.data.interestedPlanId);
    if ("status" in plan) return invalid({ interestedPlanId: ["That package is archived. Pick another."] });
  }

  const [created] = await db
    .insert(inquiry)
    .values({ ...rowValues(parsed.data), createdBy: currentUser.id })
    .returning({ id: inquiry.id });
  if (!created) throw new Error("Insert failed");

  revalidate();
  redirect(`/inquiries/${created.id}`);
}

export async function updateInquiry(inquiryId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const id = assertId(inquiryId);
  const existing = await openInquiry(id);
  if (!existing.ok) return existing.state;

  const parsed = inquirySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(flattenErrors(parsed.error));
  const linkErrors = await checkLinks(parsed.data);
  if (Object.keys(linkErrors).length > 0) return invalid(linkErrors);

  await db.update(inquiry).set(rowValues(parsed.data)).where(eq(inquiry.id, id));
  revalidate(id);
  redirect(`/inquiries/${id}`);
}

export async function deleteInquiry(inquiryId: string): Promise<void> {
  await requireUser();
  const id = assertId(inquiryId);
  await db.delete(inquiry).where(eq(inquiry.id, id));
  revalidate(id);
  redirect("/inquiries");
}

/** Log a call, message, visit or note and (re)schedule the next follow-up. */
export async function addActivity(inquiryId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const currentUser = await requireUser();
  const id = assertId(inquiryId);
  const existing = await openInquiry(id);
  if (!existing.ok) return existing.state;

  const parsed = activitySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(flattenErrors(parsed.error));
  const { type, occurredOn, notes, nextFollowUpOn } = parsed.data;
  if (type === "note" && !notes) return invalid({ notes: ["Write the note."] });

  const bump = existing.row.status === "new" && CONTACT_ACTIVITY_TYPES.includes(type);
  await db.transaction(async (tx) => {
    await tx.insert(inquiryActivity).values({ inquiryId: id, type, occurredOn, notes, recordedBy: currentUser.id });
    await tx
      .update(inquiry)
      .set({ nextFollowUpOn, ...(bump ? { status: "in_progress" as const } : {}) })
      .where(eq(inquiry.id, id));
  });

  revalidate(id);
  return {
    status: "success",
    message: nextFollowUpOn ? "Logged. Next follow-up scheduled." : "Logged. No further follow-up scheduled.",
  };
}

export async function deleteActivity(inquiryId: string, activityId: string): Promise<void> {
  await requireUser();
  const id = assertId(inquiryId);
  await db
    .delete(inquiryActivity)
    .where(and(eq(inquiryActivity.id, assertId(activityId)), eq(inquiryActivity.inquiryId, id)));
  revalidate(id);
}

export async function markLost(inquiryId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const currentUser = await requireUser();
  const id = assertId(inquiryId);
  const existing = await openInquiry(id);
  if (!existing.ok) return existing.state;

  const parsed = lostSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(flattenErrors(parsed.error));

  await db.transaction(async (tx) => {
    await tx
      .update(inquiry)
      .set({ status: "lost", lostReason: parsed.data.lostReason, closedAt: new Date(), nextFollowUpOn: null })
      .where(eq(inquiry.id, id));
    await tx.insert(inquiryActivity).values({
      inquiryId: id,
      type: "status",
      occurredOn: today(),
      notes: `Marked lost: ${parsed.data.lostReason}`,
      recordedBy: currentUser.id,
    });
  });

  revalidate(id);
  return { status: "success", message: "Marked as lost." };
}

export async function reopenInquiry(inquiryId: string): Promise<void> {
  const currentUser = await requireUser();
  const id = assertId(inquiryId);
  const row = await db.query.inquiry.findFirst({ where: eq(inquiry.id, id), columns: { status: true } });
  if (!row || row.status !== "lost") throw new Error("Only lost inquiries can be reopened.");

  await db.transaction(async (tx) => {
    await tx.update(inquiry).set({ status: "in_progress", closedAt: null }).where(eq(inquiry.id, id));
    await tx.insert(inquiryActivity).values({
      inquiryId: id,
      type: "status",
      occurredOn: today(),
      notes: "Reopened",
      recordedBy: currentUser.id,
    });
  });
  revalidate(id);
}

/**
 * Create a member from the reviewed intake form and close the inquiry as
 * converted, in one transaction. The form is the normal "New member" form,
 * pre-filled from the inquiry.
 */
export async function convertInquiry(inquiryId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const currentUser = await requireUser();
  const id = assertId(inquiryId);
  const existing = await openInquiry(id);
  if (!existing.ok) {
    return existing.state === CLOSED ? { status: "error", message: "This inquiry is already closed.", errors: {} } : existing.state;
  }

  const parsed = intakeSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(flattenErrors(parsed.error));

  const pkg = parsed.data.package;
  const plan = pkg ? await activePlan(pkg.planId, "package.") : null;
  if (plan && "status" in plan) return plan;

  const memberId = await db.transaction(async (tx) => {
    const newId = await insertMember(tx, parsed.data, plan, currentUser.id, `Baseline from inquiry #${existing.row.serialNo}`);
    await tx
      .update(inquiry)
      .set({ status: "converted", convertedMemberId: newId, closedAt: new Date(), nextFollowUpOn: null })
      .where(eq(inquiry.id, id));
    await tx.insert(inquiryActivity).values({
      inquiryId: id,
      type: "status",
      occurredOn: parsed.data.joinedOn,
      notes: "Converted to member",
      recordedBy: currentUser.id,
    });
    return newId;
  });

  revalidate(id);
  revalidatePath("/members");
  redirect(`/members/${memberId}`);
}
