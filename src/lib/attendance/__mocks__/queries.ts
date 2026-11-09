// Storybook mock for `queries.ts`, registered with sb.mock() in .storybook/preview.tsx.
// These read the database, so there is no sensible default: a story that renders
// a server component sets the data it needs, e.g.
//   beforeEach: () => { mocked(runningPackageOn).mockResolvedValue(fixture) }
import { fn } from "storybook/test";
import type * as Actual from "../queries";

function unset(name: string) {
  return async (): Promise<never> => {
    throw new Error(`queries.${name}() is not mocked in this story. Set it with mocked(${name}).mockResolvedValue(...).`);
  };
}

export const runningPackageOn: typeof Actual.runningPackageOn = fn(unset("runningPackageOn")).mockName("runningPackageOn");
export const listKioskMembers: typeof Actual.listKioskMembers = fn(unset("listKioskMembers")).mockName("listKioskMembers");
export const findKioskMemberIdsByMobile: typeof Actual.findKioskMemberIdsByMobile = fn(unset("findKioskMemberIdsByMobile")).mockName("findKioskMemberIdsByMobile");
export const listDayAttendance: typeof Actual.listDayAttendance = fn(unset("listDayAttendance")).mockName("listDayAttendance");
export const latestVisitSince: typeof Actual.latestVisitSince = fn(unset("latestVisitSince")).mockName("latestVisitSince");
export const countVisits: typeof Actual.countVisits = fn(unset("countVisits")).mockName("countVisits");
export const countDay: typeof Actual.countDay = fn(unset("countDay")).mockName("countDay");
export const getAttendanceDashboard: typeof Actual.getAttendanceDashboard = fn(unset("getAttendanceDashboard")).mockName("getAttendanceDashboard");
export const listMemberOptions: typeof Actual.listMemberOptions = fn(unset("listMemberOptions")).mockName("listMemberOptions");
