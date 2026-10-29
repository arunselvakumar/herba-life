import "server-only";

import type { FormState } from "@/lib/members/form-state";
import { requireUser, type CurrentUser } from "@/lib/session";
import { can } from "./can";
import { permissionLabel, type Permission } from "./permissions";

export class PermissionDeniedError extends Error {
  constructor(readonly permission: Permission) {
    super(`You do not have permission to do this (${permissionLabel(permission).toLowerCase()}).`);
    this.name = "PermissionDeniedError";
  }
}

/**
 * Server Action guard: the signed-in user, or an error when their role does
 * not grant `permission`. Use it in place of `requireUser()`.
 */
export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user, permission)) throw new PermissionDeniedError(permission);
  return user;
}

/** A `FormState` explaining a missing permission, for form actions that report errors inline. */
export function deniedState(permission: Permission): FormState {
  return { status: "error", message: new PermissionDeniedError(permission).message, errors: {} };
}

/**
 * For form actions: the user when allowed, otherwise an error `FormState`
 * to return straight to the form.
 */
export async function permissionFor(
  permission: Permission,
): Promise<{ ok: true; user: CurrentUser } | { ok: false; state: FormState }> {
  const user = await requireUser();
  if (!can(user, permission)) return { ok: false, state: deniedState(permission) };
  return { ok: true, user };
}
