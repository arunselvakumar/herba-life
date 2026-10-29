import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Roles: a named set of permissions from `src/lib/access/permissions.ts`.
 *
 * `permissions` holds permission keys such as `"members.create"`. A system
 * role (the built-in Administrator) ignores the stored list and is treated as
 * holding every permission, so new modules are available to administrators
 * the moment they ship. Users point at a role through `user.role_id`; see
 * `auth-schema.ts`.
 */
export const role = pgTable("role", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: text("permissions").array().notNull().default([]),
  /** Built in. Cannot be renamed, edited or deleted from the UI. */
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type Role = typeof role.$inferSelect;
export type NewRole = typeof role.$inferInsert;
