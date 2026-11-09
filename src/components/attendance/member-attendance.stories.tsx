import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import { MemberAttendance } from "@/components/attendance/member-attendance";
import { getMemberCalendar } from "@/lib/attendance/calendar";
import {
  calendarMemberId,
  midMonthCalendar,
  midMonthJoinedOn,
  newMemberCalendar,
  newMemberJoinedOn,
  regularCalendar,
  regularJoinedOn,
} from "@/stories/fixtures/attendance";
import { frame } from "@/stories/decorators";
import { TODAY } from "@/stories/fixtures/time";
import { knownIssues } from "@/stories/a11y";

// An async server component: it awaits `getMemberCalendar`, mocked per story.
const meta = {
  title: "Attendance/MemberAttendance",
  component: MemberAttendance,
  tags: ["autodocs"],
  decorators: [frame("xl")],
  parameters: {
    // Known issue: day cells in member-calendar.tsx fail colour contrast:
    // white on --hl-grass (two visits) measures 3.3:1, and future or
    // before-joining days (muted-foreground at 35–40% opacity) about 1.6:1,
    // under the 4.5:1 AA minimum for their 11px numbers. The shades are the
    // calendar's design, so changing them is a design decision.
    a11y: knownIssues("color-contrast"),
  },
  args: { memberId: calendarMemberId, today: TODAY, joinedOn: regularJoinedOn },
  beforeEach: () => {
    mocked(getMemberCalendar).mockResolvedValue(regularCalendar);
  },
} satisfies Meta<typeof MemberAttendance>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RegularVisitor: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Last visit today at 7:42 am")).toBeVisible();
    await expect(canvas.getByText(String(regularCalendar.total))).toBeVisible();
    await expect(getMemberCalendar).toHaveBeenCalledWith(calendarMemberId, TODAY, regularJoinedOn);
  },
};

export const JoinedLastMonth: Story = {
  args: { joinedOn: midMonthJoinedOn },
  beforeEach: () => {
    mocked(getMemberCalendar).mockResolvedValue(midMonthCalendar);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Last visit yesterday at 6:40 am")).toBeVisible();
  },
};

export const NewMember: Story = {
  args: { joinedOn: newMemberJoinedOn },
  beforeEach: () => {
    mocked(getMemberCalendar).mockResolvedValue(newMemberCalendar);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Has not checked in yet.")).toBeVisible();
  },
};
