// Storybook mock for `actions.ts`, registered with sb.mock() in .storybook/preview.tsx.
// Each export is a spy that resolves to a harmless default; a story overrides it with
// `mocked(kioskCheckIn).mockResolvedValue(...)` and asserts on the calls.
import { fn } from "storybook/test";
import type * as Actual from "../actions";

const saved = async () => ({ status: "success" as const, message: "Saved." });

export const kioskCheckIn: typeof Actual.kioskCheckIn = fn(async () => ({ status: "checked_in" as const, firstName: "Priya", time: "7:42 am", visitsThisMonth: 9, todayVisits: 23 })).mockName("kioskCheckIn");
export const findKioskMobileMatches: typeof Actual.findKioskMobileMatches = fn(async () => []).mockName("findKioskMobileMatches");
export const recordAttendance: typeof Actual.recordAttendance = fn(saved).mockName("recordAttendance");
export const deleteAttendance: typeof Actual.deleteAttendance = fn(async () => {}).mockName("deleteAttendance");
export const verifyExitPassword: typeof Actual.verifyExitPassword = fn(async () => ({ ok: true })).mockName("verifyExitPassword");
export const startKioskMode: typeof Actual.startKioskMode = fn(async () => ({ ok: true as const })).mockName("startKioskMode");
