import { relations } from "drizzle-orm";
import { date, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { session, user } from "./auth-schema";
import { member, memberPackage } from "./members-schema";

/**
 * Attendance: one row per visit to the branch.
 *
 * Members check themselves in on a tablet at the entrance ("Attendance Mode").
 * A package is a number of visits, and a member can take at most one a day,
 * so there is at most one row per member per `day`; the database enforces it.
 * Each row names the package the visit was taken from. `day` and `period` are
 * written at check-in time (in the branch's local time) so that reports can
 * group by day without caring about time zones.
 */

export const attendancePeriodEnum = pgEnum("attendance_period", ["morning", "afternoon", "evening"]);
export const attendanceSourceEnum = pgEnum("attendance_source", ["kiosk", "manual"]);

export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    /** The package this visit was taken from. Null once that package has been deleted. */
    memberPackageId: uuid("member_package_id").references(() => memberPackage.id, { onDelete: "set null" }),
    /** The exact instant the member tapped "Check in" (or the staff recorded the visit). */
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }).notNull().defaultNow(),
    /** Local calendar day of the visit, for grouping. */
    day: date("day").notNull(),
    period: attendancePeriodEnum("period").notNull(),
    /** `kiosk` = self check-in on the tablet; `manual` = recorded by staff. */
    source: attendanceSourceEnum("source").notNull().default("kiosk"),
    note: text("note"),
    /** The signed-in staff account on the device (kiosk) or the staff who recorded it (manual). */
    recordedBy: text("recorded_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("attendance_day_idx").on(table.day, table.checkedInAt),
    index("attendance_member_idx").on(table.memberId, table.checkedInAt),
    uniqueIndex("attendance_member_day_uq").on(table.memberId, table.day),
    index("attendance_package_idx").on(table.memberPackageId),
  ],
);

/**
 * One row per sign-in that is currently in Attendance Mode. The row existing
 * is the lock; deleting it (or the session) unlocks.
 */
export const kioskLock = pgTable("kiosk_lock", {
  sessionId: text("session_id")
    .primaryKey()
    .references(() => session.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  lockedAt: timestamp("locked_at", { withTimezone: true }).notNull().defaultNow(),
  /** Wrong exit passwords in a row since the lock started. */
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lastFailedAt: timestamp("last_failed_at", { withTimezone: true }),
});

export const attendanceRelations = relations(attendance, ({ one }) => ({
  member: one(member, { fields: [attendance.memberId], references: [member.id] }),
  memberPackage: one(memberPackage, { fields: [attendance.memberPackageId], references: [memberPackage.id] }),
  recordedByUser: one(user, { fields: [attendance.recordedBy], references: [user.id] }),
}));

export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;
export type AttendancePeriod = Attendance["period"];
export type AttendanceSource = Attendance["source"];
export type KioskLock = typeof kioskLock.$inferSelect;
