import type { LucideIcon } from "lucide-react";
import {
  CalendarCheckIcon,
  MessageSquareMoreIcon,
  PackageIcon,
  ShieldCheckIcon,
  UserCogIcon,
  UsersRoundIcon,
} from "lucide-react";
import { can, canAny, type PermissionHolder } from "@/lib/access/can";
import type { Permission } from "@/lib/access/permissions";

/**
 * What can be exported, one entry per module. Each entry is a workbook the
 * person downloads from `/api/export/<key>`; "everything" bundles every
 * workbook the person's role may export into one file.
 *
 * Safe to import from client components: no server-only code lives here.
 * The sheet builders are in `./build.ts`.
 */

export type ExportDefinition = {
  key: string;
  label: string;
  /** What the workbook holds, for the export page and the About sheet. */
  description: string;
  /** Sheet names, in order, for the export page. */
  sheets: readonly string[];
  permission: Permission;
  icon: LucideIcon;
};

export const EXPORTS = [
  {
    key: "members",
    label: "Members",
    description:
      "Every member's personal details, eating habits and health condition, with their package enrolments, follow-up readings and attendance.",
    sheets: ["Members", "Enrolments", "Follow-ups", "Attendance"],
    permission: "members.export",
    icon: UsersRoundIcon,
  },
  {
    key: "inquiries",
    label: "Enquiries",
    description: "Every enquiry, open or closed, with the free-check readings and the full follow-up log.",
    sheets: ["Enquiries", "Enquiry log"],
    permission: "inquiries.export",
    icon: MessageSquareMoreIcon,
  },
  {
    key: "packages",
    label: "Packages",
    description: "The package catalog, including archived packages, and every enrolment ever made from it.",
    sheets: ["Packages", "Enrolments"],
    permission: "packages.export",
    icon: PackageIcon,
  },
  {
    key: "attendance",
    label: "Attendance",
    description: "Every check-in with its day, time and how it was recorded, plus a per-member visit summary.",
    sheets: ["Attendance", "Attendance by member"],
    permission: "attendance.export",
    icon: CalendarCheckIcon,
  },
  {
    key: "users",
    label: "Users",
    description: "Staff accounts with their role, status and when they were last seen. Passwords are never exported.",
    sheets: ["Users"],
    permission: "users.export",
    icon: UserCogIcon,
  },
  {
    key: "roles",
    label: "Roles",
    description: "Every role with the permissions it grants, and a permission-by-role matrix.",
    sheets: ["Roles", "Permissions"],
    permission: "roles.export",
    icon: ShieldCheckIcon,
  },
] as const satisfies readonly ExportDefinition[];

export type ExportKey = (typeof EXPORTS)[number]["key"];

/** The special key that bundles every workbook the person may export. */
export const EVERYTHING_KEY = "everything";

export const EXPORT_PERMISSIONS: readonly Permission[] = EXPORTS.map((e) => e.permission);

export function findExport(key: string): ExportDefinition | undefined {
  return EXPORTS.find((e) => e.key === key);
}

export function canExport(holder: PermissionHolder, key: ExportKey): boolean {
  const def = findExport(key);
  return def ? can(holder, def.permission) : false;
}

/** True when the person may export at least one module. */
export function canExportAnything(holder: PermissionHolder): boolean {
  return canAny(holder, EXPORT_PERMISSIONS);
}

/** The modules this person may export, in catalog order. */
export function exportableModules(holder: PermissionHolder): ExportDefinition[] {
  return EXPORTS.filter((e) => can(holder, e.permission));
}

export function exportHref(key: ExportKey | typeof EVERYTHING_KEY, params?: Record<string, string>): string {
  const query = params ? new URLSearchParams(params).toString() : "";
  return `/api/export/${key}${query ? `?${query}` : ""}`;
}
