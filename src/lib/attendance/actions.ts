"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { attendance, member } from "@/db/schema";
import { auth } from "@/lib/auth";
import { toDay } from "@/lib/members/dates";
import type { FormState } from "@/lib/members/form-state";
import { requireUser } from "@/lib/session";
import { CHECKIN_COOLDOWN_MINUTES } from "./constants";
import { countDay, countVisits, latestVisitSince } from "./queries";
import { combineDayAndTime, formatTime, periodFor } from "./time";
import {
  exitPasswordSchema,
  flattenErrors,
  formDataToObject,
  manualAttendanceSchema,
  memberIdSchema,
  type FieldErrors,
} from "./validation";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function revalidateAttendance(memberId?: string) {
  revalidatePath("/attendance");
  revalidatePath("/attendance/kiosk");
  revalidatePath("/dashboard");
  if (memberId) revalidatePath(`/members/${memberId}`);
}

export type KioskCheckInResult =
  | {
      status: "checked_in";
      firstName: string;
      time: string;
      visitsThisMonth: number;
      todayVisits: number;
    }
  | { status: "already"; firstName: string; time: string; todayVisits: number }
  | { status: "error"; message: string };

/**
 * Self check-in from the tablet. A second tap within the cooldown window is
 * reported back as "already checked in" instead of creating another row.
 */
export async function kioskCheckIn(memberId: string): Promise<KioskCheckInResult> {
  const user = await requireUser();
  const parsedId = memberIdSchema.safeParse(memberId);
  if (!parsedId.success) return { status: "error", message: "That member could not be found." };

  const found = await db.query.member.findFirst({
    where: eq(member.id, parsedId.data),
    columns: { id: true, firstName: true },
  });
  if (!found) return { status: "error", message: "That member could not be found." };

  const now = new Date();
  const since = new Date(now.getTime() - CHECKIN_COOLDOWN_MINUTES * 60_000);
  const recent = await latestVisitSince(found.id, since);
  if (recent) {
    const { visits } = await countDay(toDay(now));
    return { status: "already", firstName: found.firstName, time: formatTime(recent.checkedInAt), todayVisits: visits };
  }

  const day = toDay(now);
  await db.insert(attendance).values({
    memberId: found.id,
    checkedInAt: now,
    day,
    period: periodFor(now),
    source: "kiosk",
    recordedBy: user.id,
  });

  const [visitsThisMonth, { visits: todayVisits }] = await Promise.all([
    countVisits(found.id, `${day.slice(0, 7)}-01`, day),
    countDay(day),
  ]);
  revalidateAttendance(found.id);
  return { status: "checked_in", firstName: found.firstName, time: formatTime(now), visitsThisMonth, todayVisits };
}

function invalid(errors: FieldErrors): FormState {
  return { status: "error", message: "Please fix the highlighted fields.", errors };
}

/** Staff recording a visit by hand from the attendance page. */
export async function recordAttendance(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = manualAttendanceSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(flattenErrors(parsed.error));

  const { memberId, day, time, note } = parsed.data;
  const at = combineDayAndTime(day, time);
  if (at.getTime() > Date.now() + 60_000) return invalid({ time: ["That time is in the future."] });

  const found = await db.query.member.findFirst({ where: eq(member.id, memberId), columns: { id: true, firstName: true } });
  if (!found) return invalid({ memberId: ["That member no longer exists."] });

  await db.insert(attendance).values({
    memberId,
    checkedInAt: at,
    day,
    period: periodFor(at),
    source: "manual",
    note,
    recordedBy: user.id,
  });

  revalidateAttendance(memberId);
  return { status: "success", message: `${found.firstName} marked present at ${formatTime(at)}.` };
}

export async function deleteAttendance(id: string): Promise<void> {
  await requireUser();
  if (!UUID.test(id)) throw new Error("Invalid id");
  const [removed] = await db.delete(attendance).where(eq(attendance.id, id)).returning({ memberId: attendance.memberId });
  revalidateAttendance(removed?.memberId);
}

/**
 * Leaving Attendance Mode asks the signed-in staff member for their password,
 * so a member at the tablet cannot wander into the admin screens. The check
 * uses the same hash verification as sign-in, but never touches the session.
 */
export async function verifyExitPassword(password: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const parsed = exitPasswordSchema.safeParse(password);
  if (!parsed.success) return { ok: false };

  const ctx = await auth.$context;
  const accounts = await ctx.internalAdapter.findAccounts(user.id);
  const credential = accounts.find((a) => a.providerId === "credential" && a.password);
  if (!credential?.password) return { ok: false };
  const ok = await ctx.password.verify({ hash: credential.password, password: parsed.data });
  return { ok };
}

