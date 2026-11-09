// Storybook mock for `hard-navigate.ts`, registered with sb.mock() in .storybook/preview.tsx.
// A real full page load would unload the story, so both are spies:
//   await expect(hardNavigate).toHaveBeenCalledWith("/attendance")
import { fn } from "storybook/test";
import type * as Actual from "../hard-navigate";

export const hardNavigate: typeof Actual.hardNavigate = fn().mockName("hardNavigate");
export const hardReplace: typeof Actual.hardReplace = fn().mockName("hardReplace");
