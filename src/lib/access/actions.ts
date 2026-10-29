"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { role, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import type { FormState } from "@/lib/members/form-state";
import { UUID_RE } from "@/lib/members/form-defaults";
import { flattenErrors, formDataToObject, type FieldErrors } from "@/lib/members/validation";
import { can } from "./can";
import { permissionFor, requirePermission } from "./guards";
import { countActiveAdmins } from "./queries";
import { editUserSchema, newUserSchema, roleSchema } from "./validation";

function assertId(id: string): string {
  if (!UUID_RE.test(id)) throw new Error("Invalid id");
  return id;
}

/** Better Auth mints user ids as 32-character alphanumeric strings, not UUIDs. */
const USER_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

function assertUserId(id: string): string {
  if (!USER_ID_RE.test(id)) throw new Error("Invalid id");
  return id;
}

function invalid(errors: FieldErrors, message = "Please fix the highlighted fields."): FormState {
  return { status: "error", message, errors };
}

function revalidateTeam() {
  revalidatePath("/team/users");
  revalidatePath("/team/roles");
  // Role changes alter what everyone can see; the shell reads permissions on every page.
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Roles

export async function createRole(_prev: FormState, formData: FormData): Promise<FormState> {
  const guard = await permissionFor("roles.create");
  if (!guard.ok) return guard.state;
  const parsed = roleSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(flattenErrors(parsed.error));

  const { name, description, permissions } = parsed.data;
  if (await nameTaken(name)) return invalid({ name: ["A role with this name already exists."] });

  await db.insert(role).values({ name, description, permissions });
  revalidateTeam();
  redirect("/team/roles");
}

export async function updateRole(roleId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const guard = await permissionFor("roles.update");
  if (!guard.ok) return guard.state;
  const id = assertId(roleId);
  const parsed = roleSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(flattenErrors(parsed.error));

  const existing = await db.query.role.findFirst({ where: eq(role.id, id) });
  if (!existing) return invalid({}, "This role no longer exists.");
  if (existing.isSystem) return invalid({}, "The Administrator role is built in and cannot be changed.");

  const { name, description, permissions } = parsed.data;
  if (await nameTaken(name, id)) return invalid({ name: ["A role with this name already exists."] });

  // Editing your own role must not remove your way back into this screen.
  if (guard.user.roleId === id && !permissions.includes("roles.update")) {
    return invalid(
      { "permissions[]": ["Keep “Update a role” on your own role, or you will lock yourself out of this screen."] },
      "You cannot remove your own access to roles.",
    );
  }

  await db.update(role).set({ name, description, permissions }).where(eq(role.id, id));
  revalidateTeam();
  redirect("/team/roles");
}

export async function deleteRole(roleId: string): Promise<void> {
  await requirePermission("roles.delete");
  const id = assertId(roleId);
  const existing = await db.query.role.findFirst({ where: eq(role.id, id) });
  if (!existing) return;
  if (existing.isSystem) throw new Error("The Administrator role is built in and cannot be deleted.");
  const [{ holders } = { holders: 0 }] = await db
    .select({ holders: sql<number>`count(*)`.mapWith(Number) })
    .from(user)
    .where(eq(user.roleId, id));
  if (holders > 0) throw new Error("Move the users on this role to another role first.");
  await db.delete(role).where(eq(role.id, id));
  revalidateTeam();
}

async function nameTaken(name: string, exceptId?: string): Promise<boolean> {
  const row = await db.query.role.findFirst({
    where: exceptId
      ? and(sql`lower(${role.name}) = lower(${name})`, ne(role.id, exceptId))
      : sql`lower(${role.name}) = lower(${name})`,
    columns: { id: true },
  });
  return Boolean(row);
}

// ---------------------------------------------------------------------------
// Users

async function roleExists(id: string): Promise<{ id: string; isSystem: boolean } | null> {
  const row = await db.query.role.findFirst({ where: eq(role.id, id), columns: { id: true, isSystem: true } });
  return row ?? null;
}

async function emailTaken(email: string, exceptId?: string): Promise<boolean> {
  const row = await db.query.user.findFirst({
    where: exceptId
      ? and(sql`lower(${user.email}) = ${email}`, ne(user.id, exceptId))
      : sql`lower(${user.email}) = ${email}`,
    columns: { id: true },
  });
  return Boolean(row);
}

export async function createUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const guard = await permissionFor("users.create");
  if (!guard.ok) return guard.state;
  const parsed = newUserSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(flattenErrors(parsed.error));

  const { name, email, password, roleId } = parsed.data;
  if (!(await roleExists(roleId))) return invalid({ roleId: ["That role no longer exists."] });
  if (await emailTaken(email)) return invalid({ email: ["Someone already signs in with this email."] });

  // Through Better Auth's own adapter so the password hash and the credential
  // account match what the sign-in endpoint expects.
  const ctx = await auth.$context;
  const created = await ctx.internalAdapter.createUser(
    { name, email, emailVerified: true, roleId, isActive: true },
    { method: "email-password" },
  );
  await ctx.internalAdapter.linkAccount({
    userId: created.id,
    providerId: "credential",
    accountId: created.id,
    password: await ctx.password.hash(password),
  });

  revalidateTeam();
  redirect("/team/users");
}

export async function updateUser(userId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const guard = await permissionFor("users.update");
  if (!guard.ok) return guard.state;
  const id = assertUserId(userId);
  const parsed = editUserSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(flattenErrors(parsed.error));

  const existing = await db.query.user.findFirst({ where: eq(user.id, id), with: { role: true } });
  if (!existing) return invalid({}, "This user no longer exists.");

  const { name, email, roleId, password } = parsed.data;
  const nextRole = await roleExists(roleId);
  if (!nextRole) return invalid({ roleId: ["That role no longer exists."] });
  if (await emailTaken(email, id)) return invalid({ email: ["Someone already signs in with this email."] });

  const roleChanged = existing.roleId !== roleId;
  if (roleChanged && existing.id === guard.user.id) {
    return invalid({ roleId: ["Ask another administrator to change your role."] }, "You cannot change your own role.");
  }
  if (roleChanged && existing.role?.isSystem && !nextRole.isSystem && existing.isActive && (await countActiveAdmins()) <= 1) {
    return invalid({ roleId: ["This is the only administrator. Make someone else an administrator first."] });
  }

  const ctx = await auth.$context;
  await db.update(user).set({ name, email, roleId }).where(eq(user.id, id));
  if (password) {
    await ctx.internalAdapter.updatePassword(id, await ctx.password.hash(password));
    // Other devices signed in with the old password are signed out.
    if (id !== guard.user.id) await ctx.internalAdapter.deleteUserSessions(id);
  }

  revalidateTeam();
  redirect("/team/users");
}

export async function setUserActive(userId: string, isActive: boolean): Promise<void> {
  const current = await requirePermission("users.update");
  const id = assertUserId(userId);
  if (id === current.id) throw new Error("You cannot suspend your own account.");
  const existing = await db.query.user.findFirst({ where: eq(user.id, id), with: { role: true } });
  if (!existing) return;
  if (!isActive && existing.isActive && existing.role?.isSystem && (await countActiveAdmins()) <= 1) {
    throw new Error("This is the only administrator and cannot be suspended.");
  }
  await db.update(user).set({ isActive }).where(eq(user.id, id));
  if (!isActive) {
    const ctx = await auth.$context;
    await ctx.internalAdapter.deleteUserSessions(id);
  }
  revalidateTeam();
}

export async function deleteUser(userId: string): Promise<void> {
  const current = await requirePermission("users.delete");
  const id = assertUserId(userId);
  if (id === current.id) throw new Error("You cannot delete your own account.");
  const existing = await db.query.user.findFirst({ where: eq(user.id, id), with: { role: true } });
  if (!existing) return;
  if (existing.isActive && existing.role?.isSystem && (await countActiveAdmins()) <= 1) {
    throw new Error("This is the only administrator and cannot be deleted.");
  }
  // Sessions and the credential account cascade; records they created keep a null author.
  await db.delete(user).where(eq(user.id, id));
  revalidateTeam();
}

export { can };
