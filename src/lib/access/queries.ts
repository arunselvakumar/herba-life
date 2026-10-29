import "server-only";

import { asc, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { role, session, user, type Role } from "@/db/schema";
import { ALL_PERMISSIONS, normalisePermissions, type Permission } from "./permissions";

export type RoleRow = Omit<Role, "permissions"> & { permissions: Permission[]; userCount: number };

/** Every role with how many users hold it. The built-in Administrator sorts first. */
export async function listRoles(): Promise<RoleRow[]> {
  const rows = await db
    .select({ role, userCount: count(user.id) })
    .from(role)
    .leftJoin(user, eq(user.roleId, role.id))
    .groupBy(role.id)
    .orderBy(desc(role.isSystem), asc(role.name));
  return rows.map((r) => toRoleRow(r.role, r.userCount));
}

export async function getRole(id: string): Promise<RoleRow | null> {
  const [row] = await db
    .select({ role, userCount: count(user.id) })
    .from(role)
    .leftJoin(user, eq(user.roleId, role.id))
    .where(eq(role.id, id))
    .groupBy(role.id);
  return row ? toRoleRow(row.role, row.userCount) : null;
}

function toRoleRow(row: Role, userCount: number): RoleRow {
  return {
    ...row,
    permissions: row.isSystem ? [...ALL_PERMISSIONS] : normalisePermissions(row.permissions),
    userCount,
  };
}

/** Roles for the pick-list on the user form. */
export async function listRoleOptions(): Promise<Pick<Role, "id" | "name" | "description" | "isSystem">[]> {
  return db
    .select({ id: role.id, name: role.name, description: role.description, isSystem: role.isSystem })
    .from(role)
    .orderBy(desc(role.isSystem), asc(role.name));
}

export type UserRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isActive: boolean;
  createdAt: Date;
  role: Pick<Role, "id" | "name" | "isSystem"> | null;
  /** When the user last signed in or refreshed a session. */
  lastSeenAt: Date | null;
};

export async function listUsers(): Promise<UserRow[]> {
  const lastSeen = db
    .select({ userId: session.userId, lastSeenAt: sql<Date>`max(${session.updatedAt})`.as("last_seen_at") })
    .from(session)
    .groupBy(session.userId)
    .as("last_seen");
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      isActive: user.isActive,
      createdAt: user.createdAt,
      roleId: role.id,
      roleName: role.name,
      roleIsSystem: role.isSystem,
      lastSeenAt: lastSeen.lastSeenAt,
    })
    .from(user)
    .leftJoin(role, eq(role.id, user.roleId))
    .leftJoin(lastSeen, eq(lastSeen.userId, user.id))
    .orderBy(desc(user.isActive), asc(user.name));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    image: r.image,
    isActive: r.isActive,
    createdAt: r.createdAt,
    role: r.roleId && r.roleName ? { id: r.roleId, name: r.roleName, isSystem: r.roleIsSystem ?? false } : null,
    lastSeenAt: r.lastSeenAt ? new Date(r.lastSeenAt) : null,
  }));
}

export async function getUser(id: string): Promise<UserRow | null> {
  const rows = await listUsers();
  return rows.find((u) => u.id === id) ?? null;
}

/** Active users holding a system (Administrator) role. The last one is protected. */
export async function countActiveAdmins(): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(user)
    .innerJoin(role, eq(role.id, user.roleId))
    .where(sql`${role.isSystem} = true and ${user.isActive} = true`);
  return row?.value ?? 0;
}
