import { relations } from "drizzle-orm";
import { date, index, pgEnum, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { member, packagePlan } from "./members-schema";
import { habitColumns, healthColumns, measure, measurementColumns, personColumns } from "./record-columns";

/**
 * Inquiry (prospect) schema.
 *
 * An inquiry is someone who asked about the programme but has not enrolled.
 * It records everything the member intake sheet does, plus where the person
 * came from, what they want and how the follow-up is going, so that
 * converting them into a member is a review rather than a re-entry.
 * See docs/inquiry-module.md.
 */

export const inquiryStatusEnum = pgEnum("inquiry_status", ["new", "in_progress", "converted", "lost"]);
export const inquirySourceEnum = pgEnum("inquiry_source", [
  "walk_in",
  "phone",
  "whatsapp",
  "referral",
  "social_media",
  "event",
  "other",
]);
export const inquiryActivityTypeEnum = pgEnum("inquiry_activity_type", ["call", "whatsapp", "visit", "note", "status"]);

export const inquiry = pgTable(
  "inquiry",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Human-friendly running number, like the member "Sl. No." */
    serialNo: serial("serial_no").notNull().unique(),

    status: inquiryStatusEnum("status").notNull().default("new"),
    source: inquirySourceEnum("source").notNull().default("walk_in"),
    /** Date of first contact. */
    inquiredOn: date("inquired_on").notNull(),

    ...personColumns(),
    preferredContactTime: text("preferred_contact_time"),
    /** The existing member who sent this person, when known. */
    referredByMemberId: uuid("referred_by_member_id").references(() => member.id, { onDelete: "set null" }),
    /** Staff member following this up. */
    assignedTo: text("assigned_to").references(() => user.id, { onDelete: "set null" }),

    /** Keys from GOALS in src/lib/inquiries/constants.ts */
    goals: text("goals").array().notNull().default([]),
    goalNotes: text("goal_notes"),
    interestedPlanId: uuid("interested_plan_id").references(() => packagePlan.id, { onDelete: "set null" }),

    // Free body-composition check at the first visit
    heightCm: measure("height_cm"),
    ...measurementColumns(),

    ...habitColumns(),
    ...healthColumns(),

    remarks: text("remarks"),

    /** When the next call or visit is due; drives the "follow-up due" lists. */
    nextFollowUpOn: date("next_follow_up_on"),
    lostReason: text("lost_reason"),
    /** Set when the inquiry is converted or marked lost. */
    closedAt: timestamp("closed_at"),
    convertedMemberId: uuid("converted_member_id").references(() => member.id, { onDelete: "set null" }),

    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("inquiry_status_follow_up_idx").on(table.status, table.nextFollowUpOn),
    index("inquiry_name_idx").on(table.lastName, table.firstName),
    index("inquiry_mobile_idx").on(table.mobile),
    index("inquiry_converted_member_idx").on(table.convertedMemberId),
  ],
);

/** The follow-up log: calls, messages, visits and notes, newest first. */
export const inquiryActivity = pgTable(
  "inquiry_activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    inquiryId: uuid("inquiry_id")
      .notNull()
      .references(() => inquiry.id, { onDelete: "cascade" }),
    type: inquiryActivityTypeEnum("type").notNull(),
    occurredOn: date("occurred_on").notNull(),
    notes: text("notes"),
    recordedBy: text("recorded_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("inquiry_activity_inquiry_idx").on(table.inquiryId, table.occurredOn)],
);

export const inquiryRelations = relations(inquiry, ({ many, one }) => ({
  activities: many(inquiryActivity),
  assignedUser: one(user, { fields: [inquiry.assignedTo], references: [user.id] }),
  createdByUser: one(user, { fields: [inquiry.createdBy], references: [user.id] }),
  interestedPlan: one(packagePlan, { fields: [inquiry.interestedPlanId], references: [packagePlan.id] }),
  referredByMember: one(member, { fields: [inquiry.referredByMemberId], references: [member.id] }),
  convertedMember: one(member, { fields: [inquiry.convertedMemberId], references: [member.id] }),
}));

export const inquiryActivityRelations = relations(inquiryActivity, ({ one }) => ({
  inquiry: one(inquiry, { fields: [inquiryActivity.inquiryId], references: [inquiry.id] }),
  recordedByUser: one(user, { fields: [inquiryActivity.recordedBy], references: [user.id] }),
}));

export type Inquiry = typeof inquiry.$inferSelect;
export type NewInquiry = typeof inquiry.$inferInsert;
export type InquiryActivity = typeof inquiryActivity.$inferSelect;
export type NewInquiryActivity = typeof inquiryActivity.$inferInsert;
