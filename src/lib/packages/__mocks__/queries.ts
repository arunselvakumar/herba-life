// Storybook mock for `queries.ts`, registered with sb.mock() in .storybook/preview.tsx.
// These read the database, so there is no sensible default: a story that renders
// a server component sets the data it needs, e.g.
//   beforeEach: () => { mocked(listPlans).mockResolvedValue(fixture) }
import { fn } from "storybook/test";
import type * as Actual from "../queries";

function unset(name: string) {
  return async (): Promise<never> => {
    throw new Error(`queries.${name}() is not mocked in this story. Set it with mocked(${name}).mockResolvedValue(...).`);
  };
}

export const listPlans: typeof Actual.listPlans = fn(unset("listPlans")).mockName("listPlans");
export const listActivePlans: typeof Actual.listActivePlans = fn(unset("listActivePlans")).mockName("listActivePlans");
export const getPlan: typeof Actual.getPlan = fn(unset("getPlan")).mockName("getPlan");
