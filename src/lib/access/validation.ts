import { z } from "zod";
import { blankToNull } from "@/lib/members/validation";
import { ALL_PERMISSIONS, PERMISSION_MODULES, type Permission } from "./permissions";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const permissionList = z
  .array(z.enum(ALL_PERMISSIONS as unknown as [Permission, ...Permission[]]))
  .default([])
  .transform(completeViewPermissions);

/**
 * Any action inside a module implies seeing that module, so a role that can
 * "Create a member" always gets "View members" too. Applied on the server so
 * the rule holds however the form was submitted.
 */
export function completeViewPermissions(values: readonly Permission[]): Permission[] {
  const set = new Set<Permission>(values);
  for (const mod of PERMISSION_MODULES) {
    const view = `${mod.key}.view` as Permission;
    if (mod.actions.some((a) => set.has(`${mod.key}.${a.key}` as Permission))) set.add(view);
  }
  return ALL_PERMISSIONS.filter((p) => set.has(p));
}

export const roleSchema = z.object({
  name: z.string().trim().min(2, "Give the role a name").max(60, "Keep the name under 60 characters"),
  description: z.preprocess(blankToNull, z.string().trim().max(300).nullable()).default(null),
  /** Submitted as `permissions[]`; `formDataToObject` strips the suffix. */
  permissions: permissionList,
});
export type RoleInput = z.infer<typeof roleSchema>;

const email = z.email("Enter a valid email address").trim().toLowerCase().max(254);
const name = z.string().trim().min(1, "Enter the person's name").max(80);
const roleId = z
  .string({ error: "Choose a role" })
  .regex(UUID_RE, "Choose a role");
const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Keep the password under 128 characters");

export const newUserSchema = z.object({
  name,
  email,
  password,
  roleId: z.preprocess(blankToNull, roleId),
});
export type NewUserInput = z.infer<typeof newUserSchema>;

export const editUserSchema = z.object({
  name,
  email,
  roleId: z.preprocess(blankToNull, roleId),
  /** Blank keeps the current password. */
  password: z.preprocess(blankToNull, password.nullable()).default(null),
});
export type EditUserInput = z.infer<typeof editUserSchema>;
