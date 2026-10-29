import { ADMIN_ROLE_NAME, type Permission } from "@/lib/access/permissions";

/**
 * Roles every fresh database starts with. The Administrator is a system role
 * and always holds every permission; the Staff role is an ordinary editable
 * starting point for front-desk accounts.
 */
export const DEFAULT_ROLES: readonly { name: string; description: string; isSystem: boolean; permissions: Permission[] }[] = [
  {
    name: ADMIN_ROLE_NAME,
    description: "Full access to every module, including users and roles. Built in and cannot be changed.",
    isSystem: true,
    permissions: [],
  },
  {
    name: "Staff",
    description: "Day-to-day front-desk work: members, enquiries, follow-ups and attendance.",
    isSystem: false,
    permissions: [
      "dashboard.view",
      "members.view",
      "members.create",
      "members.update",
      "members.followups",
      "members.packages",
      "inquiries.view",
      "inquiries.create",
      "inquiries.update",
      "inquiries.activities",
      "inquiries.convert",
      "packages.view",
      "attendance.view",
      "attendance.record",
      "attendance.kiosk",
    ],
  },
];
