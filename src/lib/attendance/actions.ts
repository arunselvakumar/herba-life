"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db";
import { attendance, member } from "@/db/schema";
import { auth } from "@/lib/auth";
import { daysBetween, toDay } from "@/lib/members/dates";
import type { FormState } from "@/lib/members/form-state";
import { permissionFor, requirePermission } from "@/lib/access/guards";
import { requireUser } from "@/lib/session";
import { sendCheckInMessage } from "@/lib/whatsapp/send";
import { CHECKIN_COOLDOWN_MINUTES } from "./constants";
import { countDay, countVisits, findKioskMemberIdsByMobile, latestVisitSince, runningPackageOn } from "./queries";
import { mobileNeedle } from "./search";
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

/** Sends the WhatsApp confirmation once the response is on its way, so nobody waits on it. */
function notifyCheckIn(
  found: { id: string; firstName: string; mobile: string | null },
  pkg: { name: string; endDate: string },
  at: Date,
  day: string,
) {
  after(() =>
    sendCheckInMessage({
      memberId: found.id,
      mobile: found.mobile,
      firstName: found.firstName,
      at,
      packageName: pkg.name,
      daysLeft: daysBetween(day, pkg.endDate),
    }),
  );
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
  | { status: "no_package"; firstName: string }
  | { status: "error"; message: string };

/**
 * Self check-in from the tablet. A second tap within the cooldown window is
 * reported back as "already checked in" instead of creating another row. The
 * package is checked here as well as in the member list, because the kiosk's
 * list can be minutes old.
 */
export async function kioskCheckIn(memberId: string): Promise<KioskCheckInResult> {
  const user = await requirePermission("attendance.kiosk");
  const parsedId = memberIdSchema.safeParse(memberId);
  if (!parsedId.success) return { status: "error", message: "That member could not be found." };

  const found = await db.query.member.findFirst({
    where: eq(member.id, parsedId.data),
    columns: { id: true, firstName: true, mobile: true },
  });
  if (!found) return { status: "error", message: "That member could not be found." };

  const now = new Date();
  const day = toDay(now);
  const pkg = await runningPackageOn(found.id, day);
  if (!pkg) return { status: "no_package", firstName: found.firstName };

  const since = new Date(now.getTime() - CHECKIN_COOLDOWN_MINUTES * 60_000);
  const recent = await latestVisitSince(found.id, since);
  if (recent) {
    const { visits } = await countDay(day);
    return { status: "already", firstName: found.firstName, time: formatTime(recent.checkedInAt), todayVisits: visits };
  }

  await db.insert(attendance).values({
    memberId: found.id,
    checkedInAt: now,
    day,
    period: periodFor(now),
    source: "kiosk",
    recordedBy: user.id,
  });
  notifyCheckIn(found, pkg, now, day);

  const [visitsThisMonth, { visits: todayVisits }] = await Promise.all([
    countVisits(found.id, `${day.slice(0, 7)}-01`, day),
    countDay(day),
  ]);
  revalidateAttendance(found.id);
  return { status: "checked_in", firstName: found.firstName, time: formatTime(now), visitsThisMonth, todayVisits };
}

/** Which kiosk members have a mobile containing the typed number. Returns ids only, never the numbers. */
export async function findKioskMobileMatches(query: string): Promise<string[]> {
  await requirePermission("attendance.kiosk");
  const needle = mobileNeedle(query);
  return needle ? findKioskMemberIdsByMobile(needle, toDay(new Date())) : [];
}

function invalid(errors: FieldErrors): FormState {
  return { status: "error", message: "Please fix the highlighted fields.", errors };
}

/** Staff recording a visit by hand from the attendance page. */
export async function recordAttendance(_prev: FormState, formData: FormData): Promise<FormState> {
  const guard = await permissionFor("attendance.record");
  if (!guard.ok) return guard.state;
  const user = guard.user;
  const parsed = manualAttendanceSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(flattenErrors(parsed.error));

  const { memberId, day, time, note } = parsed.data;
  const at = combineDayAndTime(day, time);
  if (at.getTime() > Date.now() + 60_000) return invalid({ time: ["That time is in the future."] });

  const found = await db.query.member.findFirst({ where: eq(member.id, memberId), columns: { id: true, firstName: true, mobile: true } });
  if (!found) return invalid({ memberId: ["That member no longer exists."] });
  const pkg = await runningPackageOn(memberId, day);
  if (!pkg) return invalid({ memberId: [`${found.firstName} has no active package on that day.`] });

  await db.insert(attendance).values({
    memberId,
    checkedInAt: at,
    day,
    period: periodFor(at),
    source: "manual",
    note,
    recordedBy: user.id,
  });
  // The message says "thanks for coming in today", so a backdated visit gets none.
  if (day === toDay(new Date())) notifyCheckIn(found, pkg, at, day);

  revalidateAttendance(memberId);
  return { status: "success", message: `${found.firstName} marked present at ${formatTime(at)}.` };
}

export async function deleteAttendance(id: string): Promise<void> {
  await requirePermission("attendance.delete");
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

