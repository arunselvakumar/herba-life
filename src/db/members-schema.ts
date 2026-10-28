import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

/**
 * Member management schema.
 *
 * Mirrors the branch's paper "Wellness Record" (intake sheet) and "Follow Up
 * Record" (monthly measurements grid), plus the package catalog. Measurements are stored as entered from
 * the body-composition scale rather than recomputed, so the digital record
 * matches what was written down.
 */

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const dietEnum = pgEnum("diet", ["veg", "non_veg", "eggetarian"]);
export const packageStatusEnum = pgEnum("package_status", [
  "active",
  "completed",
  "cancelled",
]);

const money = (name: string) => numeric(name, { precision: 10, scale: 2, mode: "number" });
const measure = (name: string) => numeric(name, { precision: 6, scale: 2, mode: "number" });

export const member = pgTable(
  "member",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** The "Sl. No." on the paper record; auto-incrementing and human friendly. */
    serialNo: serial("serial_no").notNull().unique(),

    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull().default(""),
    gender: genderEnum("gender"),
    dateOfBirth: date("date_of_birth"),
    /** Only used when the date of birth is unknown; otherwise derived. */
    age: integer("age"),
    mobile: text("mobile"),
    email: text("email"),
    address: text("address"),
    referredBy: text("referred_by"),
    /** The "Date" on the intake sheet: when the member joined. */
    joinedOn: date("joined_on").notNull(),
    heightCm: measure("height_cm"),

    // Eating habits
    wakeUpTime: text("wake_up_time"),
    teaCoffee: text("tea_coffee"),
    breakfast: text("breakfast"),
    lunch: text("lunch"),
    eveningSnacks: text("evening_snacks"),
    dinner: text("dinner"),
    diet: dietEnum("diet"),
    waterIntake: text("water_intake"),

    // Health condition
    hasBloodPressure: boolean("has_blood_pressure").notNull().default(false),
    hasSugar: boolean("has_sugar").notNull().default(false),
    hasCardiac: boolean("has_cardiac").notNull().default(false),
    medicines: text("medicines"),
    /** Keys from SYMPTOMS in src/lib/members/constants.ts */
    symptoms: text("symptoms").array().notNull().default([]),
    /** Keys from PAIN_AREAS in src/lib/members/constants.ts */
    painAreas: text("pain_areas").array().notNull().default([]),
    healthNotes: text("health_notes"),

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
 * Package catalog: the programmes the branch sells (e.g. "3 months", 90 days).
 * Maintained by admins; members are enrolled in a package from this list.
 */
export const packagePlan = pgTable("package_plan", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  durationDays: integer("duration_days").notNull(),
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
 * A member's enrolment in a package. Name, duration and price are copied from
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
    durationDays: integer("duration_days").notNull(),
    /** Bonus/extension days added on top of the plan's duration. */
    extraDays: integer("extra_days").notNull().default(0),
    startDate: date("start_date").notNull(),
    /** Last covered day: startDate + durationDays + extraDays - 1. Stored for querying. */
    endDate: date("end_date").notNull(),
    price: money("price"),
    amountPaid: money("amount_paid").notNull().default(0),
    status: packageStatusEnum("status").notNull().default("active"),
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("member_package_member_idx").on(table.memberId, table.startDate),
    index("member_package_end_idx").on(table.status, table.endDate),
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
    weightKg: measure("weight_kg"),
    bodyFatPct: measure("body_fat_pct"),
    bmi: measure("bmi"),
    visceralFat: measure("visceral_fat"),
    bmr: integer("bmr"),
    bodyAge: integer("body_age"),
    muscleMassPct: measure("muscle_mass_pct"),
    waistCm: measure("waist_cm"),
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
