// Storybook mock for `actions.ts`, registered with sb.mock() in .storybook/preview.tsx.
// Each export is a spy that resolves to a harmless default; a story overrides it with
// `mocked(createRole).mockResolvedValue(...)` and asserts on the calls.
import { fn } from "storybook/test";
import type * as Actual from "../actions";

const saved = async () => ({ status: "success" as const, message: "Saved." });

export const createRole: typeof Actual.createRole = fn(saved).mockName("createRole");
export const updateRole: typeof Actual.updateRole = fn(saved).mockName("updateRole");
export const deleteRole: typeof Actual.deleteRole = fn(async () => {}).mockName("deleteRole");
export const createUser: typeof Actual.createUser = fn(saved).mockName("createUser");
export const updateUser: typeof Actual.updateUser = fn(saved).mockName("updateUser");
export const setUserActive: typeof Actual.setUserActive = fn(async () => {}).mockName("setUserActive");
export const deleteUser: typeof Actual.deleteUser = fn(async () => {}).mockName("deleteUser");
export const changeOwnPassword: typeof Actual.changeOwnPassword = fn(saved).mockName("changeOwnPassword");
