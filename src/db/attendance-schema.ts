import { relations } from "drizzle-orm";
import { date, index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { member } from "./members-schema";

/**
 * Attendance: one row per visit to the branch.
 *
 * Members check themselves in on a tablet at the entrance ("Attendance Mode"),
 * so a member can have several rows on the same day: a morning visit for the
 * breakfast shake and an evening one for the tea. `day` and `period` are
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
  ],
);

export const attendanceRelations = relations(attendance, ({ one }) => ({
  member: one(member, { fields: [attendance.memberId], references: [member.id] }),
  recordedByUser: one(user, { fields: [attendance.recordedBy], references: [user.id] }),
}));

export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;
export type AttendancePeriod = Attendance["period"];
export type AttendanceSource = Attendance["source"];
