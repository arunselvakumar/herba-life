import type { LucideIcon } from "lucide-react";
import {
  CalendarCheckIcon,
  LayoutDashboardIcon,
  MessageSquareMoreIcon,
  PackageIcon,
  ShieldCheckIcon,
  UserCogIcon,
  UsersRoundIcon,
} from "lucide-react";

/**
 * The permission registry: the single list of everything a role can allow.
 *
 * Every module declares its actions here. The role editor renders this list
 * as checkboxes, roles store the keys they grant (`"members.create"`), and
 * server code checks them with `can()`. Adding a module or an action to this
 * file is all it takes for it to appear in every role's editor; existing
 * roles simply do not have the new key until someone ticks it. The
 * built-in Administrator role is the exception: it always holds every key.
 *
 * Safe to import from client components: no server-only code lives here.
 */

export type PermissionAction = {
  /** Short key, unique within the module. */
  key: string;
  /** Question-style label shown next to the checkbox. */
  label: string;
  /** One line on what the action unlocks. */
  hint?: string;
};

export type PermissionModule = {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  actions: readonly PermissionAction[];
};

export const PERMISSION_MODULES = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "The overview screen with counts, follow-ups due and recent activity.",
    icon: LayoutDashboardIcon,
    actions: [{ key: "view", label: "View the dashboard" }],
  },
  {
    key: "members",
    label: "Members",
    description: "Member records, follow-up readings and the packages they are enrolled in.",
    icon: UsersRoundIcon,
    actions: [
      { key: "view", label: "View members", hint: "The list, search and each member's profile" },
      { key: "create", label: "Create a member", hint: "Enrol new members and convert enquiries" },
      { key: "update", label: "Update a member", hint: "Edit personal details, habits and health" },
      { key: "delete", label: "Delete a member", hint: "Removes the member with all history" },
      { key: "followups", label: "Record follow-ups", hint: "Add and remove follow-up readings" },
      { key: "packages", label: "Manage member packages", hint: "Enrol, complete, cancel or delete a package" },
    ],
  },
  {
    key: "inquiries",
    label: "Enquiries",
    description: "Prospects who asked about the programme and their follow-up log.",
    icon: MessageSquareMoreIcon,
    actions: [
      { key: "view", label: "View enquiries" },
      { key: "create", label: "Create an enquiry" },
      { key: "update", label: "Update an enquiry", hint: "Edit details, mark lost, reopen" },
      { key: "delete", label: "Delete an enquiry" },
      { key: "activities", label: "Log follow-ups", hint: "Add and remove calls, messages and visits" },
      { key: "convert", label: "Convert to member", hint: "Also needs “Create a member”" },
    ],
  },
  {
    key: "packages",
    label: "Package catalog",
    description: "The programmes the branch sells: names, durations and prices.",
    icon: PackageIcon,
    actions: [
      { key: "view", label: "View the catalog" },
      { key: "create", label: "Create a package" },
      { key: "update", label: "Update a package", hint: "Edit, archive or restore" },
      { key: "delete", label: "Delete a package" },
    ],
  },
  {
    key: "attendance",
    label: "Attendance",
    description: "Daily check-ins, trends and the member-facing Attendance Mode.",
    icon: CalendarCheckIcon,
    actions: [
      { key: "view", label: "View attendance", hint: "The attendance page and each member's calendar" },
      { key: "record", label: "Record a visit by hand" },
      { key: "delete", label: "Remove a check-in" },
      { key: "kiosk", label: "Open Attendance Mode", hint: "Sign the tablet in for self check-in" },
    ],
  },
  {
    key: "users",
    label: "Users",
    description: "Staff accounts that can sign in to this console.",
    icon: UserCogIcon,
    actions: [
      { key: "view", label: "View users" },
      { key: "create", label: "Create a user" },
      { key: "update", label: "Update a user", hint: "Change name, email, role or password; suspend or restore" },
      { key: "delete", label: "Delete a user" },
    ],
  },
  {
    key: "roles",
    label: "Roles",
    description: "What each kind of staff member is allowed to do.",
    icon: ShieldCheckIcon,
    actions: [
      { key: "view", label: "View roles" },
      { key: "create", label: "Create a role" },
      { key: "update", label: "Update a role" },
      { key: "delete", label: "Delete a role" },
    ],
  },
] as const satisfies readonly PermissionModule[];

type Modules = typeof PERMISSION_MODULES;
type ModuleKey = Modules[number]["key"];
type ActionsOf<M extends ModuleKey> = Extract<Modules[number], { key: M }>["actions"][number]["key"];

/** `"members.create"`, `"attendance.kiosk"`, … */
export type Permission = { [M in ModuleKey]: `${M}.${ActionsOf<M>}` }[ModuleKey];

export const ALL_PERMISSIONS: readonly Permission[] = PERMISSION_MODULES.flatMap((m) =>
  m.actions.map((a) => `${m.key}.${a.key}` as Permission),
);

const PERMISSION_SET: ReadonlySet<string> = new Set(ALL_PERMISSIONS);

export function isPermission(value: unknown): value is Permission {
  return typeof value === "string" && PERMISSION_SET.has(value);
}

/** Drop unknown keys (for example from a module that was since removed) and duplicates. */
export function normalisePermissions(values: readonly string[]): Permission[] {
  const seen = new Set<Permission>();
  for (const value of values) if (isPermission(value)) seen.add(value);
  return ALL_PERMISSIONS.filter((p) => seen.has(p));
}

export function moduleOf(permission: Permission): PermissionModule {
  const key = permission.split(".")[0];
  const found = PERMISSION_MODULES.find((m) => m.key === key);
  if (!found) throw new Error(`Unknown permission module: ${permission}`);
  return found;
}

export function permissionLabel(permission: Permission): string {
  const [moduleKey, actionKey] = permission.split(".");
  const mod = PERMISSION_MODULES.find((m) => m.key === moduleKey);
  const action = mod?.actions.find((a) => a.key === actionKey);
  return action ? `${mod?.label}: ${action.label}` : permission;
}

/** The permission that unlocks a module's pages, e.g. `"members.view"`. */
export function viewPermission(moduleKey: ModuleKey): Permission {
  return `${moduleKey}.view` as Permission;
}

/** The built-in role every branch has. It cannot be edited or deleted and always holds every permission. */
export const ADMIN_ROLE_NAME = "Administrator";
