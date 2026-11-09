// Storybook mock for `calendar-actions.ts`, registered with sb.mock() in .storybook/preview.tsx.
// Each export is a spy that resolves to a harmless default; a story overrides it with
// `mocked(loadOlderAttendanceMonths).mockResolvedValue(...)` and asserts on the calls.
import { fn } from "storybook/test";
import type * as Actual from "../calendar-actions";

export const loadOlderAttendanceMonths: typeof Actual.loadOlderAttendanceMonths = fn(async () => ({ months: [], hasMore: false })).mockName("loadOlderAttendanceMonths");
