// Storybook mock for `actions.ts`, registered with sb.mock() in .storybook/preview.tsx.
// Each export is a spy that resolves to a harmless default; a story overrides it with
// `mocked(createInquiry).mockResolvedValue(...)` and asserts on the calls.
import { fn } from "storybook/test";
import type * as Actual from "../actions";

const saved = async () => ({ status: "success" as const, message: "Saved." });

export const createInquiry: typeof Actual.createInquiry = fn(saved).mockName("createInquiry");
export const updateInquiry: typeof Actual.updateInquiry = fn(saved).mockName("updateInquiry");
export const deleteInquiry: typeof Actual.deleteInquiry = fn(async () => {}).mockName("deleteInquiry");
export const addActivity: typeof Actual.addActivity = fn(saved).mockName("addActivity");
export const deleteActivity: typeof Actual.deleteActivity = fn(async () => {}).mockName("deleteActivity");
export const markLost: typeof Actual.markLost = fn(saved).mockName("markLost");
export const reopenInquiry: typeof Actual.reopenInquiry = fn(async () => {}).mockName("reopenInquiry");
export const convertInquiry: typeof Actual.convertInquiry = fn(saved).mockName("convertInquiry");
