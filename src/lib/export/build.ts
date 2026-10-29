import "server-only";

import { asc, count, desc, eq, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  attendance,
  inquiry,
  inquiryActivity,
  member,
  memberCheckin,
  memberPackage,
  packagePlan,
  role,
  user,
  type Attendance,
  type Inquiry,
  type InquiryActivity,
  type Member,
  type MemberCheckin,
  type MemberPackage,
} from "@/db/schema";
import { can } from "@/lib/access/can";
import { PERMISSION_MODULES, type Permission } from "@/lib/access/permissions";
import { listRoles, listUsers, type RoleRow, type UserRow } from "@/lib/access/queries";
import { PERIODS, SOURCES } from "@/lib/attendance/constants";
import { formatTime } from "@/lib/attendance/time";
import { ACTIVITY_LABELS } from "@/lib/inquiries/constants";
import { goalLabels, sourceLabel, statusLabel } from "@/lib/inquiries/format";
import { DIETS, EXPIRING_SOON_DAYS, GENDERS, PAIN_AREAS, SYMPTOMS } from "@/lib/members/constants";
import { addDays, today } from "@/lib/members/dates";
import { daysLeft, displayAge, fullName, packageState } from "@/lib/members/format";
import { pickCurrentPackage } from "@/lib/members/queries";
import { listPlans, type PlanRow } from "@/lib/packages/queries";
import type { CurrentUser } from "@/lib/session";
import { EVERYTHING_KEY, EXPORTS, exportableModules, findExport, type ExportDefinition } from "./catalog";
import { addAboutSheet, addSheet, createWorkbook, toBuffer, type Column, type SheetSpec } from "./workbook";

/**
 * Builds the workbooks described in `./catalog.ts`.
 *
 * Every sheet is produced by a small builder that fetches its own rows and
 * says how each column is read. Builders are keyed by sheet name so the
 * "everything" workbook can include each sheet once even when two modules
 * share one (Members and Packages both carry Enrolments).
 */

type Context = {
  user: CurrentUser;
  today: string;
  /** Staff names by id, for the "created by" style columns. */
  staff: Map<string, string>;
  /** Limits the Members workbook to one member. */
  memberId?: string;
};

type Named = { firstName: string; lastName: string; serialNo: number };

const label = <T extends string>(options: readonly { value: T; label: string }[], value: T | null | undefined) =>
  value ? (options.find((o) => o.value === value)?.label ?? value) : null;
const labels = (options: readonly { value: string; label: string }[], values: readonly string[]) =>
  options
    .filter((o) => values.includes(o.value))
    .map((o) => o.label)
    .join(", ");
const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const memberLabel = (m: Named | null | undefined) => (m ? `#${m.serialNo} ${fullName(m)}` : null);

// ---------------------------------------------------------------------------
// Column groups shared by the Members and Enquiries sheets (they mirror the
// column factories in src/db/record-columns.ts).

type Person = Pick<Member, "firstName" | "lastName" | "gender" | "dateOfBirth" | "age" | "mobile" | "email" | "address" | "referredBy">;
type Habits = Pick<Member, "wakeUpTime" | "teaCoffee" | "breakfast" | "lunch" | "eveningSnacks" | "dinner" | "diet" | "waterIntake">;
type Health = Pick<Member, "hasBloodPressure" | "hasSugar" | "hasCardiac" | "medicines" | "symptoms" | "painAreas" | "healthNotes">;
type Readings = Pick<MemberCheckin, "weightKg" | "bodyFatPct" | "bmi" | "visceralFat" | "bmr" | "bodyAge" | "muscleMassPct" | "waistCm">;

function personColumns<Row extends Person>(): Column<Row>[] {
  return [
    { header: "First name", get: (r) => r.firstName },
    { header: "Last name", get: (r) => r.lastName },
    { header: "Gender", width: 10, get: (r) => label(GENDERS, r.gender) },
    { header: "Date of birth", kind: "date", get: (r) => r.dateOfBirth },
    { header: "Age", kind: "number", width: 6, get: (r) => displayAge(r) },
    { header: "Mobile", width: 14, get: (r) => r.mobile },
    { header: "Email", width: 26, get: (r) => r.email },
    { header: "Address", width: 32, get: (r) => r.address },
    { header: "Referred by", get: (r) => r.referredBy },
  ];
}

function habitColumns<Row extends Habits>(): Column<Row>[] {
  return [
    { header: "Wake-up time", width: 12, get: (r) => r.wakeUpTime },
    { header: "Tea / coffee", get: (r) => r.teaCoffee },
    { header: "Breakfast", width: 24, get: (r) => r.breakfast },
    { header: "Lunch", width: 24, get: (r) => r.lunch },
    { header: "Evening snacks", width: 24, get: (r) => r.eveningSnacks },
    { header: "Dinner", width: 24, get: (r) => r.dinner },
    { header: "Diet", width: 14, get: (r) => label(DIETS, r.diet) },
    { header: "Water intake", width: 12, get: (r) => r.waterIntake },
  ];
}

function healthColumns<Row extends Health>(): Column<Row>[] {
  return [
    { header: "Blood pressure", kind: "bool", width: 14, get: (r) => r.hasBloodPressure },
    { header: "Sugar", kind: "bool", get: (r) => r.hasSugar },
    { header: "Cardiac", kind: "bool", get: (r) => r.hasCardiac },
    { header: "Medicines", width: 24, get: (r) => r.medicines },
    { header: "Symptoms", width: 28, get: (r) => labels(SYMPTOMS, r.symptoms) },
    { header: "Pain areas", width: 20, get: (r) => labels(PAIN_AREAS, r.painAreas) },
    { header: "Health notes", width: 32, get: (r) => r.healthNotes },
  ];
}

function readingColumns<Row>(pick: (row: Row) => Readings | null): Column<Row>[] {
  const num = (header: string, key: keyof Readings, width = 11): Column<Row> => ({
    header,
    kind: "number",
    width,
    get: (r) => pick(r)?.[key],
  });
  return [
    num("Weight (kg)", "weightKg"),
    num("Body fat (%)", "bodyFatPct", 12),
    num("BMI", "bmi", 8),
    num("Visceral fat", "visceralFat", 12),
    num("BMR (kcal)", "bmr"),
    num("Body age", "bodyAge", 9),
    num("Muscle mass (%)", "muscleMassPct", 15),
    num("Waist (cm)", "waistCm"),
  ];
}

// ---------------------------------------------------------------------------
// Members: the record, its enrolments, follow-ups and attendance.

type MemberWithHistory = Member & { packages: MemberPackage[]; checkins: MemberCheckin[] };
type VisitStats = { visits: number; firstDay: string | null; lastDay: string | null };

async function loadMembers(ctx: Context): Promise<MemberWithHistory[]> {
  return db.query.member.findMany({
    ...(ctx.memberId ? { where: eq(member.id, ctx.memberId) } : {}),
    with: {
      packages: { orderBy: [desc(memberPackage.startDate), desc(memberPackage.createdAt)] },
      checkins: { orderBy: [desc(memberCheckin.recordedOn), desc(memberCheckin.createdAt)] },
    },
    orderBy: [asc(member.serialNo)],
  });
}

async function loadVisitStats(): Promise<Map<string, VisitStats>> {
  const rows = await db
    .select({
      memberId: attendance.memberId,
      visits: sql<number>`count(*)`.mapWith(Number),
      firstDay: sql<string>`min(${attendance.day})`,
      lastDay: sql<string>`max(${attendance.day})`,
    })
    .from(attendance)
    .groupBy(attendance.memberId);
  return new Map(rows.map((r) => [r.memberId, { visits: r.visits, firstDay: r.firstDay, lastDay: r.lastDay }]));
}

async function membersSheet(ctx: Context): Promise<SheetSpec<MemberWithHistory>> {
  const [rows, visits] = await Promise.all([loadMembers(ctx), loadVisitStats()]);
  const current = (m: MemberWithHistory) => pickCurrentPackage(m.packages, ctx.today);
  const state = (m: MemberWithHistory) => {
    const pkg = current(m);
    return pkg ? packageState(pkg, EXPIRING_SOON_DAYS, ctx.today) : null;
  };
  const columns: Column<MemberWithHistory>[] = [
    { header: "Member no.", kind: "number", width: 11, get: (r) => r.serialNo },
    ...personColumns<MemberWithHistory>(),
    { header: "Joined on", kind: "date", get: (r) => r.joinedOn },
    { header: "Height (cm)", kind: "number", width: 11, get: (r) => r.heightCm },
    { header: "Current package", width: 20, get: (r) => current(r)?.name },
    { header: "Package status", width: 14, get: (r) => (state(r) ? capitalise(state(r) as string) : null) },
    { header: "Package start", kind: "date", get: (r) => current(r)?.startDate },
    { header: "Package end", kind: "date", get: (r) => current(r)?.endDate },
    {
      header: "Days left",
      kind: "number",
      width: 9,
      get: (r) => {
        const pkg = current(r);
        const s = state(r);
        return pkg && (s === "active" || s === "expiring") ? daysLeft(pkg, ctx.today) : null;
      },
    },
    { header: "Last follow-up", kind: "date", get: (r) => r.checkins[0]?.recordedOn },
    ...readingColumns<MemberWithHistory>((r) => r.checkins[0] ?? null).map((c) => ({ ...c, header: `Latest ${c.header.toLowerCase()}` })),
    { header: "Enrolments", kind: "number", width: 11, get: (r) => r.packages.length },
    { header: "Follow-ups", kind: "number", width: 11, get: (r) => r.checkins.length },
    { header: "Visits", kind: "number", width: 8, get: (r) => visits.get(r.id)?.visits ?? 0 },
    { header: "Last visit", kind: "date", get: (r) => visits.get(r.id)?.lastDay },
    ...habitColumns<MemberWithHistory>(),
    ...healthColumns<MemberWithHistory>(),
    { header: "Remarks", width: 32, get: (r) => r.remarks },
    { header: "Created by", get: (r) => (r.createdBy ? ctx.staff.get(r.createdBy) : null) },
    { header: "Created at", kind: "datetime", get: (r) => r.createdAt },
    { header: "Updated at", kind: "datetime", get: (r) => r.updatedAt },
    { header: "Member ID", width: 38, get: (r) => r.id },
  ];
  return { name: "Members", description: "one row per member with their current package and latest readings", columns, rows };
}

type EnrolmentRow = MemberPackage & { member: Named };

async function enrolmentsSheet(ctx: Context): Promise<SheetSpec<EnrolmentRow>> {
  const rows = await db.query.memberPackage.findMany({
    ...(ctx.memberId ? { where: eq(memberPackage.memberId, ctx.memberId) } : {}),
    with: { member: { columns: { serialNo: true, firstName: true, lastName: true } } },
    orderBy: [asc(memberPackage.startDate), asc(memberPackage.createdAt)],
  });
  const columns: Column<EnrolmentRow>[] = [
    { header: "Member no.", kind: "number", width: 11, get: (r) => r.member.serialNo },
    { header: "Member", width: 24, get: (r) => fullName(r.member) },
    { header: "Package", width: 20, get: (r) => r.name },
    { header: "Duration (days)", kind: "number", width: 14, get: (r) => r.durationDays },
    { header: "Extra days", kind: "number", width: 10, get: (r) => r.extraDays },
    { header: "Start date", kind: "date", get: (r) => r.startDate },
    { header: "End date", kind: "date", get: (r) => r.endDate },
    { header: "Status", width: 11, get: (r) => capitalise(packageState(r, EXPIRING_SOON_DAYS, ctx.today)) },
    { header: "Price", kind: "money", get: (r) => r.price },
    { header: "Amount paid", kind: "money", get: (r) => r.amountPaid },
    { header: "Balance", kind: "money", get: (r) => (r.price === null ? null : r.price - r.amountPaid) },
    { header: "Notes", width: 32, get: (r) => r.notes },
    { header: "Created by", get: (r) => (r.createdBy ? ctx.staff.get(r.createdBy) : null) },
    { header: "Created at", kind: "datetime", get: (r) => r.createdAt },
    { header: "Updated at", kind: "datetime", get: (r) => r.updatedAt },
    { header: "Enrolment ID", width: 38, get: (r) => r.id },
    { header: "Member ID", width: 38, get: (r) => r.memberId },
    { header: "Package ID", width: 38, get: (r) => r.planId },
  ];
  return { name: "Enrolments", description: "every package a member was ever enrolled in", columns, rows };
}

type CheckinRow = MemberCheckin & { member: Named };

async function followUpsSheet(ctx: Context): Promise<SheetSpec<CheckinRow>> {
  const rows = await db.query.memberCheckin.findMany({
    ...(ctx.memberId ? { where: eq(memberCheckin.memberId, ctx.memberId) } : {}),
    with: { member: { columns: { serialNo: true, firstName: true, lastName: true } } },
    orderBy: [asc(memberCheckin.recordedOn), asc(memberCheckin.createdAt)],
  });
  const columns: Column<CheckinRow>[] = [
    { header: "Member no.", kind: "number", width: 11, get: (r) => r.member.serialNo },
    { header: "Member", width: 24, get: (r) => fullName(r.member) },
    { header: "Recorded on", kind: "date", get: (r) => r.recordedOn },
    ...readingColumns<CheckinRow>((r) => r),
    { header: "Remarks", width: 32, get: (r) => r.remarks },
    { header: "Recorded by", get: (r) => (r.recordedBy ? ctx.staff.get(r.recordedBy) : null) },
    { header: "Created at", kind: "datetime", get: (r) => r.createdAt },
    { header: "Follow-up ID", width: 38, get: (r) => r.id },
    { header: "Member ID", width: 38, get: (r) => r.memberId },
  ];
  return { name: "Follow-ups", description: "every follow-up reading, oldest first", columns, rows };
}

type AttendanceRow = Attendance & { member: Named & { mobile: string | null } };

async function loadAttendance(ctx: Context): Promise<AttendanceRow[]> {
  return db.query.attendance.findMany({
    ...(ctx.memberId ? { where: eq(attendance.memberId, ctx.memberId) } : {}),
    with: { member: { columns: { serialNo: true, firstName: true, lastName: true, mobile: true } } },
    orderBy: [asc(attendance.checkedInAt)],
  });
}

async function attendanceSheet(ctx: Context): Promise<SheetSpec<AttendanceRow>> {
  const rows = await loadAttendance(ctx);
  const columns: Column<AttendanceRow>[] = [
    { header: "Day", kind: "date", get: (r) => r.day },
    { header: "Time", width: 9, get: (r) => formatTime(r.checkedInAt) },
    { header: "Period", width: 11, get: (r) => label(PERIODS, r.period) },
    { header: "Member no.", kind: "number", width: 11, get: (r) => r.member.serialNo },
    { header: "Member", width: 24, get: (r) => fullName(r.member) },
    { header: "Source", width: 18, get: (r) => label(SOURCES, r.source) },
    { header: "Note", width: 28, get: (r) => r.note },
    { header: "Recorded by", get: (r) => (r.recordedBy ? ctx.staff.get(r.recordedBy) : null) },
    { header: "Checked in at", kind: "datetime", get: (r) => r.checkedInAt },
    { header: "Check-in ID", width: 38, get: (r) => r.id },
    { header: "Member ID", width: 38, get: (r) => r.memberId },
  ];
  return { name: "Attendance", description: "every check-in, oldest first", columns, rows };
}

type MemberVisits = { member: Pick<Member, "id" | "serialNo" | "firstName" | "lastName" | "mobile">; visits: number; firstDay: string; lastDay: string; thisMonth: number; last30: number };

async function attendanceByMemberSheet(ctx: Context): Promise<SheetSpec<MemberVisits>> {
  const rows = await loadAttendance(ctx);
  const monthStart = `${ctx.today.slice(0, 7)}-01`;
  const since = addDays(ctx.today, -29);
  const byMember = new Map<string, MemberVisits>();
  for (const row of rows) {
    const entry = byMember.get(row.memberId) ?? {
      member: { id: row.memberId, ...row.member },
      visits: 0,
      firstDay: row.day,
      lastDay: row.day,
      thisMonth: 0,
      last30: 0,
    };
    entry.visits += 1;
    if (row.day < entry.firstDay) entry.firstDay = row.day;
    if (row.day > entry.lastDay) entry.lastDay = row.day;
    if (row.day >= monthStart) entry.thisMonth += 1;
    if (row.day >= since) entry.last30 += 1;
    byMember.set(row.memberId, entry);
  }
  const summary = [...byMember.values()].sort((a, b) => a.member.serialNo - b.member.serialNo);
  const columns: Column<MemberVisits>[] = [
    { header: "Member no.", kind: "number", width: 11, get: (r) => r.member.serialNo },
    { header: "Member", width: 24, get: (r) => fullName(r.member) },
    { header: "Mobile", width: 14, get: (r) => r.member.mobile },
    { header: "Visits", kind: "number", width: 8, get: (r) => r.visits },
    { header: "Visits this month", kind: "number", width: 16, get: (r) => r.thisMonth },
    { header: "Visits in last 30 days", kind: "number", width: 20, get: (r) => r.last30 },
    { header: "First visit", kind: "date", get: (r) => r.firstDay },
    { header: "Last visit", kind: "date", get: (r) => r.lastDay },
    { header: "Member ID", width: 38, get: (r) => r.member.id },
  ];
  return { name: "Attendance by member", description: "visit totals per member", columns, rows: summary };
}

// ---------------------------------------------------------------------------
// Enquiries and their follow-up log.

type InquiryRow = Inquiry & {
  activities: InquiryActivity[];
  assignedUser: { name: string } | null;
  interestedPlan: { name: string } | null;
  referredByMember: Named | null;
  convertedMember: Named | null;
};

async function inquiriesSheet(ctx: Context): Promise<SheetSpec<InquiryRow>> {
  const rows = await db.query.inquiry.findMany({
    with: {
      activities: { columns: { id: true } },
      assignedUser: { columns: { name: true } },
      interestedPlan: { columns: { name: true } },
      referredByMember: { columns: { serialNo: true, firstName: true, lastName: true } },
      convertedMember: { columns: { serialNo: true, firstName: true, lastName: true } },
    },
    orderBy: [asc(inquiry.serialNo)],
  });
  const columns: Column<InquiryRow>[] = [
    { header: "Enquiry no.", kind: "number", width: 11, get: (r) => r.serialNo },
    { header: "Status", width: 12, get: (r) => statusLabel(r.status) },
    { header: "Source", width: 13, get: (r) => sourceLabel(r.source) },
    { header: "Enquired on", kind: "date", get: (r) => r.inquiredOn },
    ...personColumns<InquiryRow>(),
    { header: "Referred by member", width: 22, get: (r) => memberLabel(r.referredByMember) },
    { header: "Preferred contact time", width: 20, get: (r) => r.preferredContactTime },
    { header: "Assigned to", get: (r) => r.assignedUser?.name },
    { header: "Goals", width: 28, get: (r) => goalLabels(r.goals).join(", ") },
    { header: "Goal notes", width: 32, get: (r) => r.goalNotes },
    { header: "Interested package", width: 20, get: (r) => r.interestedPlan?.name },
    { header: "Next follow-up", kind: "date", get: (r) => r.nextFollowUpOn },
    { header: "Follow-ups logged", kind: "number", width: 16, get: (r) => r.activities.length },
    { header: "Lost reason", width: 28, get: (r) => r.lostReason },
    { header: "Closed at", kind: "datetime", get: (r) => r.closedAt },
    { header: "Converted member", width: 22, get: (r) => memberLabel(r.convertedMember) },
    { header: "Height (cm)", kind: "number", width: 11, get: (r) => r.heightCm },
    ...readingColumns<InquiryRow>((r) => r),
    ...habitColumns<InquiryRow>(),
    ...healthColumns<InquiryRow>(),
    { header: "Remarks", width: 32, get: (r) => r.remarks },
    { header: "Created by", get: (r) => (r.createdBy ? ctx.staff.get(r.createdBy) : null) },
    { header: "Created at", kind: "datetime", get: (r) => r.createdAt },
    { header: "Updated at", kind: "datetime", get: (r) => r.updatedAt },
    { header: "Enquiry ID", width: 38, get: (r) => r.id },
    { header: "Converted member ID", width: 38, get: (r) => r.convertedMemberId },
  ];
  return { name: "Enquiries", description: "one row per enquiry, open or closed", columns, rows: rows as InquiryRow[] };
}

type ActivityRow = InquiryActivity & { inquiry: Named };

async function inquiryLogSheet(ctx: Context): Promise<SheetSpec<ActivityRow>> {
  const rows = await db.query.inquiryActivity.findMany({
    with: { inquiry: { columns: { serialNo: true, firstName: true, lastName: true } } },
    orderBy: [asc(inquiryActivity.occurredOn), asc(inquiryActivity.createdAt)],
  });
  const columns: Column<ActivityRow>[] = [
    { header: "Enquiry no.", kind: "number", width: 11, get: (r) => r.inquiry.serialNo },
    { header: "Person", width: 24, get: (r) => fullName(r.inquiry) },
    { header: "Type", width: 11, get: (r) => ACTIVITY_LABELS[r.type] },
    { header: "Occurred on", kind: "date", get: (r) => r.occurredOn },
    { header: "Notes", width: 48, get: (r) => r.notes },
    { header: "Recorded by", get: (r) => (r.recordedBy ? ctx.staff.get(r.recordedBy) : null) },
    { header: "Created at", kind: "datetime", get: (r) => r.createdAt },
    { header: "Activity ID", width: 38, get: (r) => r.id },
    { header: "Enquiry ID", width: 38, get: (r) => r.inquiryId },
  ];
  return { name: "Enquiry log", description: "every call, message, visit and note, oldest first", columns, rows };
}

// ---------------------------------------------------------------------------
// Package catalog.

async function packagesSheet(ctx: Context): Promise<SheetSpec<PlanRow>> {
  const rows = await listPlans();
  const columns: Column<PlanRow>[] = [
    { header: "Package", width: 24, get: (r) => r.name },
    { header: "Duration (days)", kind: "number", width: 14, get: (r) => r.durationDays },
    { header: "Price", kind: "money", get: (r) => r.price },
    { header: "Description", width: 40, get: (r) => r.description },
    { header: "Status", width: 10, get: (r) => (r.isActive ? "Active" : "Archived") },
    { header: "Sort order", kind: "number", width: 10, get: (r) => r.sortOrder },
    { header: "Enrolments", kind: "number", width: 11, get: (r) => r.enrolments },
    { header: "Active enrolments", kind: "number", width: 16, get: (r) => r.activeEnrolments },
    { header: "Created by", get: (r) => (r.createdBy ? ctx.staff.get(r.createdBy) : null) },
    { header: "Created at", kind: "datetime", get: (r) => r.createdAt },
    { header: "Updated at", kind: "datetime", get: (r) => r.updatedAt },
    { header: "Package ID", width: 38, get: (r) => r.id },
  ];
  return { name: "Packages", description: "the catalog, including archived packages", columns, rows };
}

// ---------------------------------------------------------------------------
// Team: users, roles and the permission matrix.

async function usersSheet(): Promise<SheetSpec<UserRow>> {
  const rows = await listUsers();
  const columns: Column<UserRow>[] = [
    { header: "Name", width: 24, get: (r) => r.name },
    { header: "Email", width: 30, get: (r) => r.email },
    { header: "Role", width: 18, get: (r) => r.role?.name },
    { header: "Status", width: 11, get: (r) => (r.isActive ? "Active" : "Suspended") },
    { header: "Last seen", kind: "datetime", get: (r) => r.lastSeenAt },
    { header: "Added on", kind: "datetime", get: (r) => r.createdAt },
    { header: "User ID", width: 36, get: (r) => r.id },
    { header: "Role ID", width: 38, get: (r) => r.role?.id },
  ];
  return { name: "Users", description: "staff accounts; passwords are never exported", columns, rows };
}

async function rolesSheet(): Promise<SheetSpec<RoleRow>> {
  const rows = await listRoles();
  const columns: Column<RoleRow>[] = [
    { header: "Role", width: 20, get: (r) => r.name },
    { header: "Description", width: 48, get: (r) => r.description },
    { header: "Type", width: 10, get: (r) => (r.isSystem ? "Built-in" : "Custom") },
    { header: "Users", kind: "number", width: 8, get: (r) => r.userCount },
    { header: "Permissions", kind: "number", width: 12, get: (r) => r.permissions.length },
    { header: "Permission keys", width: 80, get: (r) => r.permissions.join(", ") },
    { header: "Created at", kind: "datetime", get: (r) => r.createdAt },
    { header: "Updated at", kind: "datetime", get: (r) => r.updatedAt },
    { header: "Role ID", width: 38, get: (r) => r.id },
  ];
  return { name: "Roles", description: "every role and the permission keys it grants", columns, rows };
}

type PermissionRow = { module: string; action: string; hint: string | null; key: Permission };

async function permissionsSheet(): Promise<SheetSpec<PermissionRow>> {
  const roles = await listRoles();
  const rows: PermissionRow[] = PERMISSION_MODULES.flatMap((m) =>
    m.actions.map((a) => ({ module: m.label, action: a.label, hint: "hint" in a ? a.hint : null, key: `${m.key}.${a.key}` as Permission })),
  );
  const columns: Column<PermissionRow>[] = [
    { header: "Module", width: 16, get: (r) => r.module },
    { header: "Permission", width: 28, get: (r) => r.action },
    { header: "Details", width: 44, get: (r) => r.hint },
    { header: "Key", width: 22, get: (r) => r.key },
    ...roles.map(
      (role): Column<PermissionRow> => ({
        header: role.name,
        width: Math.max(10, role.name.length + 2),
        get: (r) => (role.permissions.includes(r.key) ? "Yes" : null),
      }),
    ),
  ];
  return { name: "Permissions", description: "which role holds which permission", columns, rows };
}

// ---------------------------------------------------------------------------
// Putting a workbook together.

type SheetBuilder = (ctx: Context) => Promise<SheetSpec>;

const BUILDERS: Record<string, SheetBuilder> = {
  Members: membersSheet as SheetBuilder,
  Enrolments: enrolmentsSheet as SheetBuilder,
  "Follow-ups": followUpsSheet as SheetBuilder,
  Attendance: attendanceSheet as SheetBuilder,
  "Attendance by member": attendanceByMemberSheet as SheetBuilder,
  Enquiries: inquiriesSheet as SheetBuilder,
  "Enquiry log": inquiryLogSheet as SheetBuilder,
  Packages: packagesSheet as SheetBuilder,
  Users: usersSheet as SheetBuilder,
  Roles: rolesSheet as SheetBuilder,
  Permissions: permissionsSheet as SheetBuilder,
};

/**
 * The Members workbook carries the member's attendance too, so a branch
 * moving away gets the whole history in one file. That sheet still needs the
 * attendance module to be visible to the person exporting.
 */
function sheetsFor(def: ExportDefinition, user: CurrentUser): string[] {
  return def.sheets.filter((name) => name !== "Attendance" || def.key !== "members" || can(user, "attendance.view"));
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function stamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

export type BuiltExport = { filename: string; body: Uint8Array<ArrayBuffer> };

export class ExportNotFoundError extends Error {}

/**
 * Build one module's workbook, the single-member workbook when `memberId`
 * is given, or (`everything`) every module the person may export.
 */
export async function buildExport(
  key: string,
  exporter: CurrentUser,
  options: { memberId?: string | undefined } = {},
): Promise<BuiltExport> {
  const exportedAt = new Date();
  const staffRows = await db.select({ id: user.id, name: user.name }).from(user);
  const staff = new Map<string, string>(staffRows.map((u) => [u.id, u.name]));
  const ctx: Context = { user: exporter, today: today(), staff, ...(options.memberId ? { memberId: options.memberId } : {}) };

  let title: string;
  let filename: string;
  let sheetNames: string[];

  if (key === EVERYTHING_KEY) {
    const modules = exportableModules(exporter);
    sheetNames = [...new Set(modules.flatMap((def) => sheetsFor(def, exporter)))];
    title = "Herbalife Internal · full export";
    filename = `herbalife-everything-${stamp(exportedAt)}.xlsx`;
  } else {
    const def = findExport(key);
    if (!def) throw new ExportNotFoundError(`Unknown export: ${key}`);
    sheetNames = sheetsFor(def, exporter);
    title = `Herbalife Internal · ${def.label}`;
    filename = `herbalife-${def.key}-${stamp(exportedAt)}.xlsx`;
    if (def.key === "members" && ctx.memberId) {
      const [only] = await loadMembers(ctx);
      if (!only) throw new ExportNotFoundError("Member not found");
      title = `Member #${only.serialNo} · ${fullName(only)}`;
      filename = `herbalife-member-${only.serialNo}-${slug(fullName(only))}-${stamp(exportedAt)}.xlsx`;
    }
  }

  const sheets: SheetSpec[] = [];
  for (const name of sheetNames) {
    const build = BUILDERS[name];
    if (!build) throw new Error(`No builder for sheet ${name}`);
    sheets.push(await build(ctx));
  }

  const meta = { title, exportedBy: exporter.name, exportedAt };
  const workbook = createWorkbook(meta);
  addAboutSheet(workbook, meta, sheets);
  for (const spec of sheets) addSheet(workbook, spec);
  // Open on the first data sheet; About is there when someone wants it.
  workbook.views = [{ x: 0, y: 0, width: 20000, height: 12000, firstSheet: 0, activeTab: sheets.length > 0 ? 1 : 0, visibility: "visible" }];

  return { filename, body: await toBuffer(workbook) };
}

export const EXPORT_KEYS: readonly string[] = [...EXPORTS.map((e) => e.key), EVERYTHING_KEY];

/**
 * Row counts per sheet, for the export page. The permission matrix has one
 * row per permission key, so it needs no query.
 */
export async function countExportRows(): Promise<Record<string, number>> {
  const [counts, [visitors]] = await Promise.all([
    Promise.all([member, memberPackage, memberCheckin, attendance, inquiry, inquiryActivity, packagePlan, user, role].map(countRows)),
    db.select({ value: sql<number>`count(distinct ${attendance.memberId})`.mapWith(Number) }).from(attendance),
  ]);
  const [members, enrolments, followUps, visits, inquiries, activities, plans, users, roles] = counts;
  return {
    Members: members ?? 0,
    Enrolments: enrolments ?? 0,
    "Follow-ups": followUps ?? 0,
    Attendance: visits ?? 0,
    "Attendance by member": visitors?.value ?? 0,
    Enquiries: inquiries ?? 0,
    "Enquiry log": activities ?? 0,
    Packages: plans ?? 0,
    Users: users ?? 0,
    Roles: roles ?? 0,
    Permissions: PERMISSION_MODULES.reduce((n, m) => n + m.actions.length, 0),
  };
}

async function countRows(table: PgTable): Promise<number> {
  const [row] = await db.select({ value: count() }).from(table);
  return row?.value ?? 0;
}
