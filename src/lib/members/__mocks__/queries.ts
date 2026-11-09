// Storybook mock for `queries.ts`, registered with sb.mock() in .storybook/preview.tsx.
// These read the database, so there is no sensible default: a story that renders
// a server component sets the data it needs, e.g.
//   beforeEach: () => { mocked(listMembers).mockResolvedValue(fixture) }
import { fn } from "storybook/test";
import type * as Actual from "../queries";

function unset(name: string) {
  return async (): Promise<never> => {
    throw new Error(`queries.${name}() is not mocked in this story. Set it with mocked(${name}).mockResolvedValue(...).`);
  };
}

export const listMembers: typeof Actual.listMembers = fn(unset("listMembers")).mockName("listMembers");
export const getMember: typeof Actual.getMember = fn(unset("getMember")).mockName("getMember");
export const getDashboardData: typeof Actual.getDashboardData = fn(unset("getDashboardData")).mockName("getDashboardData");
export const memberExists: typeof Actual.memberExists = fn(unset("memberExists")).mockName("memberExists");
