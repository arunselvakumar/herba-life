import { relations } from "drizzle-orm";
import { boolean, date, index, integer, pgEnum, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { habitColumns, healthColumns, measure, measurementColumns, money, personColumns } from "./record-columns";

/**
 * Member management schema.
 *
 * Mirrors the branch's paper "Wellness Record" (intake sheet) and "Follow Up
 * Record" (monthly measurements grid), plus the package catalog. Measurements are stored as entered from
 * the body-composition scale rather than recomputed, so the digital record
 * matches what was written down.
 */

export const packageStatusEnum = pgEnum("package_status", [
  "active",
  "completed",
  "cancelled",
]);

export const member = pgTable(
  "member",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** The "Sl. No." on the paper record; auto-incrementing and human friendly. */
    serialNo: serial("serial_no").notNull().unique(),

    ...personColumns(),
    /** The "Date" on the intake sheet: when the member joined. */
    joinedOn: date("joined_on").notNull(),
    heightCm: measure("height_cm"),

    ...habitColumns(),
    ...healthColumns(),

    remarks: text("remarks"),

    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("member_last_name_idx").on(table.lastName, table.firstName),
    index("member_mobile_idx").on(table.mobile),
  ],
);

/**
 * Package catalog: the programmes the branch sells (e.g. "1 month", 30 visits).
 * A package is a number of visits, not a stretch of the calendar: a member
 * can skip days and loses nothing. Maintained by admins; members are enrolled
 * in a package from this list.
 */
export const packagePlan = pgTable("package_plan", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  /** How many visits the package buys. A member can use at most one a day. */
  visits: integer("visits").notNull(),
  price: money("price"),
  description: text("description"),
  /** Archived plans stay on old enrolments but cannot be picked for new ones. */
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

/**
 * A member's enrolment in a package. Name, visits and price are copied from
 * the plan at enrolment time so later edits to the catalog do not rewrite
 * history.
 */
export const memberPackage = pgTable(
  "member_package",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    planId: uuid("plan_id").references(() => packagePlan.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    visits: integer("visits").notNull(),
    /** Bonus visits added on top of the plan's. */
    extraVisits: integer("extra_visits").notNull().default(0),
    /**
     * Visits taken so far: the attendance rows that point at this package.
     * Kept here so "has visits left" is a plain column comparison; it is only
     * ever changed in the same transaction that adds or removes such a row.
     */
    visitsUsed: integer("visits_used").notNull().default(0),
    /** First day a visit can be taken from this package. There is no last day: it runs until its visits are used. */
    startDate: date("start_date").notNull(),
    price: money("price"),
    amountPaid: money("amount_paid").notNull().default(0),
    status: packageStatusEnum("status").notNull().default("active"),
    notes: text("notes"),
    /** When the "few visits left" WhatsApp reminder was dealt with, so each package is reminded about once. */
    lowVisitsReminderSentAt: timestamp("low_visits_reminder_sent_at"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("member_package_member_idx").on(table.memberId, table.startDate),
    index("member_package_status_idx").on(table.status, table.startDate),
    index("member_package_plan_idx").on(table.planId),
  ],
);

export const memberCheckin = pgTable(
  "member_checkin",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    recordedOn: date("recorded_on").notNull(),
    ...measurementColumns(),
    remarks: text("remarks"),
    recordedBy: text("recorded_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("member_checkin_member_idx").on(table.memberId, table.recordedOn)],
);

export const memberRelations = relations(member, ({ many, one }) => ({
  packages: many(memberPackage),
  checkins: many(memberCheckin),
  createdByUser: one(user, { fields: [member.createdBy], references: [user.id] }),
}));

export const memberPackageRelations = relations(memberPackage, ({ one }) => ({
  member: one(member, { fields: [memberPackage.memberId], references: [member.id] }),
  plan: one(packagePlan, { fields: [memberPackage.planId], references: [packagePlan.id] }),
}));

export const packagePlanRelations = relations(packagePlan, ({ many }) => ({
  enrolments: many(memberPackage),
}));

export const memberCheckinRelations = relations(memberCheckin, ({ one }) => ({
  member: one(member, { fields: [memberCheckin.memberId], references: [member.id] }),
  recordedByUser: one(user, { fields: [memberCheckin.recordedBy], references: [user.id] }),
}));

export type Member = typeof member.$inferSelect;
export type NewMember = typeof member.$inferInsert;
export type PackagePlan = typeof packagePlan.$inferSelect;
export type NewPackagePlan = typeof packagePlan.$inferInsert;
export type MemberPackage = typeof memberPackage.$inferSelect;
export type NewMemberPackage = typeof memberPackage.$inferInsert;
export type MemberCheckin = typeof memberCheckin.$inferSelect;
export type NewMemberCheckin = typeof memberCheckin.$inferInsert;
