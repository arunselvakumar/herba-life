// Storybook mock for `queries.ts`, registered with sb.mock() in .storybook/preview.tsx.
// These read the database, so there is no sensible default: a story that renders
// a server component sets the data it needs, e.g.
//   beforeEach: () => { mocked(listInquiries).mockResolvedValue(fixture) }
import { fn } from "storybook/test";
import type * as Actual from "../queries";

function unset(name: string) {
  return async (): Promise<never> => {
    throw new Error(`queries.${name}() is not mocked in this story. Set it with mocked(${name}).mockResolvedValue(...).`);
  };
}

export const listInquiries: typeof Actual.listInquiries = fn(unset("listInquiries")).mockName("listInquiries");
export const getInquiry: typeof Actual.getInquiry = fn(unset("getInquiry")).mockName("getInquiry");
export const findMembersByMobile: typeof Actual.findMembersByMobile = fn(unset("findMembersByMobile")).mockName("findMembersByMobile");
export const getSourceInquiry: typeof Actual.getSourceInquiry = fn(unset("getSourceInquiry")).mockName("getSourceInquiry");
export const listStaff: typeof Actual.listStaff = fn(unset("listStaff")).mockName("listStaff");
export const listMemberOptions: typeof Actual.listMemberOptions = fn(unset("listMemberOptions")).mockName("listMemberOptions");
export const getInquiryDashboard: typeof Actual.getInquiryDashboard = fn(unset("getInquiryDashboard")).mockName("getInquiryDashboard");
