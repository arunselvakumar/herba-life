// Storybook mock for `queries.ts`, registered with sb.mock() in .storybook/preview.tsx.
// These read the database, so there is no sensible default: a story that renders
// a server component sets the data it needs, e.g.
//   beforeEach: () => { mocked(listRoles).mockResolvedValue(fixture) }
import { fn } from "storybook/test";
import type * as Actual from "../queries";

function unset(name: string) {
  return async (): Promise<never> => {
    throw new Error(`queries.${name}() is not mocked in this story. Set it with mocked(${name}).mockResolvedValue(...).`);
  };
}

export const listRoles: typeof Actual.listRoles = fn(unset("listRoles")).mockName("listRoles");
export const getRole: typeof Actual.getRole = fn(unset("getRole")).mockName("getRole");
export const listRoleOptions: typeof Actual.listRoleOptions = fn(unset("listRoleOptions")).mockName("listRoleOptions");
export const listUsers: typeof Actual.listUsers = fn(unset("listUsers")).mockName("listUsers");
export const getUser: typeof Actual.getUser = fn(unset("getUser")).mockName("getUser");
export const countActiveAdmins: typeof Actual.countActiveAdmins = fn(unset("countActiveAdmins")).mockName("countActiveAdmins");
