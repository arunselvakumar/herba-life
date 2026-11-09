// Storybook mock for `actions.ts`, registered with sb.mock() in .storybook/preview.tsx.
// Each export is a spy that resolves to a harmless default; a story overrides it with
// `mocked(createMember).mockResolvedValue(...)` and asserts on the calls.
import { fn } from "storybook/test";
import type * as Actual from "../actions";

const saved = async () => ({ status: "success" as const, message: "Saved." });

export const createMember: typeof Actual.createMember = fn(saved).mockName("createMember");
export const updateMember: typeof Actual.updateMember = fn(saved).mockName("updateMember");
export const deleteMember: typeof Actual.deleteMember = fn(async () => {}).mockName("deleteMember");
export const addCheckin: typeof Actual.addCheckin = fn(saved).mockName("addCheckin");
export const deleteCheckin: typeof Actual.deleteCheckin = fn(async () => {}).mockName("deleteCheckin");
export const createPackage: typeof Actual.createPackage = fn(saved).mockName("createPackage");
export const setPackageStatus: typeof Actual.setPackageStatus = fn(async () => {}).mockName("setPackageStatus");
export const deletePackage: typeof Actual.deletePackage = fn(async () => {}).mockName("deletePackage");
