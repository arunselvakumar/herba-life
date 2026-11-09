// Storybook mock for `session.ts`, registered with sb.mock() in .storybook/preview.tsx.
// Everyone is signed in as the administrator unless a story says otherwise:
//   beforeEach: () => { mocked(getCurrentUser).mockResolvedValue(frontDeskUser) }
import { fn } from "storybook/test";
import { adminUser } from "@/stories/fixtures/users";
import type * as Actual from "../session";

export type { CurrentUser } from "../session";

export const getCurrentUser: typeof Actual.getCurrentUser = fn(async () => adminUser).mockName("getCurrentUser");
export const getKioskUser: typeof Actual.getKioskUser = fn(async () => adminUser).mockName("getKioskUser");
export const requireSession: typeof Actual.requireSession = fn(async () => ({ user: adminUser, sessionId: "storybook-session" })).mockName("requireSession");
export const requireUser: typeof Actual.requireUser = fn(async () => adminUser).mockName("requireUser");
export const findCurrentUser: typeof Actual.findCurrentUser = fn(async () => adminUser).mockName("findCurrentUser");
