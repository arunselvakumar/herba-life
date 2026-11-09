// Storybook mock for `actions.ts`, registered with sb.mock() in .storybook/preview.tsx.
// Each export is a spy that resolves to a harmless default; a story overrides it with
// `mocked(createPlan).mockResolvedValue(...)` and asserts on the calls.
import { fn } from "storybook/test";
import type * as Actual from "../actions";

const saved = async () => ({ status: "success" as const, message: "Saved." });

export const createPlan: typeof Actual.createPlan = fn(saved).mockName("createPlan");
export const updatePlan: typeof Actual.updatePlan = fn(saved).mockName("updatePlan");
export const setPlanActive: typeof Actual.setPlanActive = fn(async () => {}).mockName("setPlanActive");
export const deletePlan: typeof Actual.deletePlan = fn(async () => {}).mockName("deletePlan");
