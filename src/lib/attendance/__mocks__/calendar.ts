// Storybook mock for `calendar.ts`, registered with sb.mock() in .storybook/preview.tsx.
// These read the database, so there is no sensible default: a story that renders
// a server component sets the data it needs, e.g.
//   beforeEach: () => { mocked(getMemberCalendar).mockResolvedValue(fixture) }
import { fn } from "storybook/test";
import type * as Actual from "../calendar";

function unset(name: string) {
  return async (): Promise<never> => {
    throw new Error(`calendar.${name}() is not mocked in this story. Set it with mocked(${name}).mockResolvedValue(...).`);
  };
}

export const getMemberCalendar: typeof Actual.getMemberCalendar = fn(unset("getMemberCalendar")).mockName("getMemberCalendar");
export const getOlderCalendarMonths: typeof Actual.getOlderCalendarMonths = fn(unset("getOlderCalendarMonths")).mockName("getOlderCalendarMonths");
