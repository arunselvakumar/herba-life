import { ALL_PERMISSIONS, type Permission } from "@/lib/access/permissions";
import type { CurrentUser } from "@/lib/session";

export const adminUser = {
  id: "0b5a8c1e-7e1f-4f53-9a43-3c2f7f0a0001",
  name: "Arun Selva Kumar",
  email: "arun@herbalife.test",
  image: null,
  roleId: "role-admin",
  roleName: "Administrator",
  isAdmin: true,
  permissions: [...ALL_PERMISSIONS],
  kioskLocked: false,
} satisfies CurrentUser;

const frontDeskPermissions: Permission[] = [
  "dashboard.view",
  "members.view",
  "members.create",
  "attendance.view",
  "attendance.record",
  "attendance.kiosk",
  "inquiries.view",
  "inquiries.create",
  "inquiries.activities",
  "stock.view",
  "stock.sell",
];

/** Day-to-day staff: can record and sell, can't manage the team or export. */
export const frontDeskUser = {
  id: "0b5a8c1e-7e1f-4f53-9a43-3c2f7f0a0002",
  name: "Meena Raghavan",
  email: "meena@herbalife.test",
  image: null,
  roleId: "role-front-desk",
  roleName: "Front desk",
  isAdmin: false,
  permissions: frontDeskPermissions,
  kioskLocked: false,
} satisfies CurrentUser;

/** Signed in, but no role assigned yet: every page shows "No access". */
export const noRoleUser = {
  id: "0b5a8c1e-7e1f-4f53-9a43-3c2f7f0a0003",
  name: "New Starter",
  email: "new@herbalife.test",
  image: null,
  roleId: null,
  roleName: null,
  isAdmin: false,
  permissions: [],
  kioskLocked: false,
} satisfies CurrentUser;

/** Front desk on a tablet in Attendance Mode: the lock narrows them to the kiosk alone. */
export const kioskUser = {
  ...frontDeskUser,
  isAdmin: false,
  permissions: ["attendance.kiosk"],
  kioskLocked: true,
} satisfies CurrentUser;
