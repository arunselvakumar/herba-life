import type { Permission } from "./permissions";

/** Anything with a permission list: the current user, or a role. */
export type PermissionHolder = { permissions: readonly string[]; isAdmin?: boolean };

export function can(holder: PermissionHolder, permission: Permission): boolean {
  return holder.isAdmin === true || holder.permissions.includes(permission);
}

export function canAny(holder: PermissionHolder, permissions: readonly Permission[]): boolean {
  return permissions.some((p) => can(holder, p));
}

export function canAll(holder: PermissionHolder, permissions: readonly Permission[]): boolean {
  return permissions.every((p) => can(holder, p));
}
