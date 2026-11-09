import type { listRoleOptions, listRoles, listUsers } from "@/lib/access/queries";
import { ALL_PERMISSIONS, type Permission } from "@/lib/access/permissions";
import type { CurrentUser } from "@/lib/session";
import { at } from "./time";
import { adminUser, frontDeskUser } from "./users";

type RoleRow = Awaited<ReturnType<typeof listRoles>>[number];
type UserRow = Awaited<ReturnType<typeof listUsers>>[number];
type RoleOption = Awaited<ReturnType<typeof listRoleOptions>>[number];

// Role ids are UUIDs: the edit-role page 404s on anything else.
export const ADMIN_ROLE_ID = "5e1a0000-0000-4000-8000-000000000001";
export const FRONT_DESK_ROLE_ID = "5e1a0000-0000-4000-8000-000000000002";
export const COACH_ROLE_ID = "5e1a0000-0000-4000-8000-000000000003";
export const STOCK_ROLE_ID = "5e1a0000-0000-4000-8000-000000000004";
export const TEAM_LEAD_ROLE_ID = "5e1a0000-0000-4000-8000-000000000005";

const coachPermissions: Permission[] = [
  "dashboard.view",
  "members.view",
  "members.update",
  "members.followups",
  "members.packages",
  "attendance.view",
  "attendance.record",
];

const stockPermissions: Permission[] = [
  "dashboard.view",
  "stock.view",
  "stock.receive",
  "stock.sell",
  "stock.adjust",
  "stock.products",
  "stock.delete",
  "stock.export",
];

/** Can look after the team, including editing their own role. */
const teamLeadPermissions: Permission[] = ["dashboard.view", "users.view", "users.update", "roles.view", "roles.update"];

export const adminRole = {
  id: ADMIN_ROLE_ID,
  name: "Administrator",
  description: "Everything, including users, roles and exports.",
  permissions: [...ALL_PERMISSIONS],
  isSystem: true,
  userCount: 2,
  createdAt: at(-400, 9),
  updatedAt: at(-400, 9),
} satisfies RoleRow;

export const frontDeskRole = {
  id: FRONT_DESK_ROLE_ID,
  name: "Front desk",
  description: "Greets members, records visits and sells products.",
  permissions: [...frontDeskUser.permissions],
  isSystem: false,
  userCount: 3,
  createdAt: at(-300, 11),
  updatedAt: at(-20, 16),
} satisfies RoleRow;

export const coachRole = {
  id: COACH_ROLE_ID,
  name: "Wellness coach",
  description: "Takes follow-up readings and manages member packages.",
  permissions: coachPermissions,
  isSystem: false,
  userCount: 1,
  createdAt: at(-200, 10),
  updatedAt: at(-200, 10),
} satisfies RoleRow;

/** Nobody holds it, so it can be deleted. */
export const stockRole = {
  id: STOCK_ROLE_ID,
  name: "Stock keeper",
  description: null,
  permissions: stockPermissions,
  isSystem: false,
  userCount: 0,
  createdAt: at(-60, 12),
  updatedAt: at(-60, 12),
} satisfies RoleRow;

export const teamLeadRole = {
  id: TEAM_LEAD_ROLE_ID,
  name: "Team lead",
  description: "Looks after staff accounts and what each role may do.",
  permissions: teamLeadPermissions,
  isSystem: false,
  userCount: 1,
  createdAt: at(-90, 12),
  updatedAt: at(-90, 12),
} satisfies RoleRow;

/** As `listRoles()` returns them: the built-in Administrator first, then by name. */
export const roleRows = [adminRole, frontDeskRole, stockRole, teamLeadRole, coachRole] satisfies RoleRow[];

/** As `listRoleOptions()` returns them, for the user form's pick-list. */
export const roleOptions = roleRows.map(({ id, name, description, isSystem }) => ({ id, name, description, isSystem })) satisfies RoleOption[];

/** The signed-in administrator, as a row in the users table. */
export const adminUserRow = {
  id: adminUser.id,
  name: adminUser.name,
  email: adminUser.email,
  image: null,
  isActive: true,
  createdAt: at(-400, 9),
  role: { id: ADMIN_ROLE_ID, name: "Administrator", isSystem: true },
  lastSeenAt: at(0, 10, 25),
} satisfies UserRow;

export const frontDeskUserRow = {
  id: frontDeskUser.id,
  name: frontDeskUser.name,
  email: frontDeskUser.email,
  image: null,
  isActive: true,
  createdAt: at(-250, 10),
  role: { id: FRONT_DESK_ROLE_ID, name: "Front desk", isSystem: false },
  lastSeenAt: at(-1, 18, 40),
} satisfies UserRow;

/** As `listUsers()` returns them: active first, then by name. */
export const userRows = [
  adminUserRow,
  {
    id: "0b5a8c1e-7e1f-4f53-9a43-3c2f7f0a0010",
    name: "Divya Krishnan",
    email: "divya@herbalife.test",
    image: null,
    isActive: true,
    createdAt: at(-180, 9),
    role: { id: COACH_ROLE_ID, name: "Wellness coach", isSystem: false },
    lastSeenAt: at(-6, 9, 15),
  },
  frontDeskUserRow,
  {
    id: "0b5a8c1e-7e1f-4f53-9a43-3c2f7f0a0011",
    name: "Suresh Venkataraman",
    email: "suresh.venkataraman@herbalife.test",
    image: null,
    isActive: true,
    createdAt: at(-2, 15),
    role: null,
    lastSeenAt: null,
  },
  {
    id: "0b5a8c1e-7e1f-4f53-9a43-3c2f7f0a0012",
    name: "Anand Pillai",
    email: "anand@herbalife.test",
    image: null,
    isActive: false,
    createdAt: at(-320, 11),
    role: { id: FRONT_DESK_ROLE_ID, name: "Front desk", isSystem: false },
    lastSeenAt: at(-75, 17),
  },
] satisfies UserRow[];

/** Holds the Team lead role, so editing that role locks "Update a role". */
export const teamLeadUser = {
  id: "0b5a8c1e-7e1f-4f53-9a43-3c2f7f0a0013",
  name: "Kavitha Subramanian",
  email: "kavitha@herbalife.test",
  image: null,
  roleId: TEAM_LEAD_ROLE_ID,
  roleName: "Team lead",
  isAdmin: false,
  permissions: teamLeadPermissions,
  kioskLocked: false,
} satisfies CurrentUser;

/** Can see roles but not users: the Team tabs collapse to one. */
export const rolesOnlyUser = {
  ...teamLeadUser,
  id: "0b5a8c1e-7e1f-4f53-9a43-3c2f7f0a0014",
  name: "Ravi Shankar",
  email: "ravi@herbalife.test",
  permissions: ["dashboard.view", "roles.view"],
} satisfies CurrentUser;
