import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor, within } from "storybook/test";
import { MemberCalendar } from "@/components/attendance/member-calendar";
import { loadOlderAttendanceMonths } from "@/lib/attendance/calendar-actions";
import { frame, onSurface } from "@/stories/decorators";
import {
  calendarMemberId,
  makeCalendarMonth,
  midMonthJoinedOn,
  midMonthMonths,
  newMemberCalendar,
  newMemberJoinedOn,
  olderMonths,
  regularJoinedOn,
  regularMonths,
} from "@/stories/fixtures/attendance";
import { TODAY } from "@/stories/fixtures/time";
import { knownIssues } from "@/stories/a11y";

// The calendar sits inside the member profile's attendance card.
const meta = {
  title: "Attendance/MemberCalendar",
  component: MemberCalendar,
  tags: ["autodocs"],
  decorators: [onSurface, frame("xl")],
  parameters: {
    // Known issue: day cells in member-calendar.tsx fail colour contrast:
    // white on --hl-grass (two visits) measures 3.3:1, and future or
    // before-joining days (muted-foreground at 35–40% opacity) about 1.6:1,
    // under the 4.5:1 AA minimum for their 11px numbers. The shades are the
    // calendar's design, so changing them is a design decision.
    a11y: knownIssues("color-contrast"),
  },
  args: {
    memberId: calendarMemberId,
    initialMonths: regularMonths,
    initialHasMore: false,
    today: TODAY,
    joinedOn: regularJoinedOn,
  },
} satisfies Meta<typeof MemberCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CurrentMonth: Story = {
  args: { initialMonths: regularMonths.slice(-1), joinedOn: "2026-11-01" },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("[data-month]")).toHaveLength(1);
  },
};

/** A year of visits; the strip starts scrolled to the newest month. */
export const SeveralMonths: Story = {
  play: async ({ canvas }) => {
    const strip = canvas.getByLabelText("Attendance by month");
    await waitFor(() => expect(strip.scrollLeft + strip.clientWidth).toBeGreaterThanOrEqual(strip.scrollWidth - 1));
  },
};

/** Joined on the 20th: earlier days of that month are dimmed, and the strip begins at the join marker. */
export const JoinedMidMonth: Story = {
  args: { initialMonths: midMonthMonths, joinedOn: midMonthJoinedOn },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Joined/)).toBeVisible();
  },
};

export const NoVisitsYet: Story = {
  args: { initialMonths: newMemberCalendar.months, joinedOn: newMemberJoinedOn },
};

/** Focusing (or hovering) a day with visits shows each check-in's time. */
export const DayDetails: Story = {
  args: { initialMonths: [makeCalendarMonth(TODAY.slice(0, 7), { seed: 4 })], joinedOn: "2026-11-01" },
  play: async ({ canvasElement, userEvent }) => {
    const day = canvasElement.querySelector<HTMLButtonElement>('[data-month] button[data-visits]:not([data-visits="0"])');
    if (!day) throw new Error("expected a day with visits");
    await userEvent.hover(day);
    const tooltip = await within(document.body).findByRole("tooltip");
    await expect(tooltip).toHaveTextContent(/visit/);
    await userEvent.unhover(day);
  },
};

/** Scrolling back to the oldest month asks the server for six more. */
export const LoadMore: Story = {
  args: { initialHasMore: true },
  beforeEach: () => {
    mocked(loadOlderAttendanceMonths).mockResolvedValue({ months: olderMonths, hasMore: false });
  },
  play: async ({ canvas, canvasElement }) => {
    const strip = canvas.getByLabelText("Attendance by month");
    strip.scrollTo({ left: 0 });
    await waitFor(() => expect(loadOlderAttendanceMonths).toHaveBeenCalledWith(calendarMemberId, regularMonths[0]?.month));
    await waitFor(() => expect(canvasElement.querySelectorAll("[data-month]")).toHaveLength(regularMonths.length + olderMonths.length));
    // Nothing older: the strip now ends at the month they joined.
    await expect(canvas.getByText(/Joined/)).toBeInTheDocument();
  },
};

/** A strip too short to scroll keeps fetching until it fills the width. */
export const ShortStripLoadsMore: Story = {
  args: { initialMonths: regularMonths.slice(-1), initialHasMore: true },
  beforeEach: () => {
    mocked(loadOlderAttendanceMonths).mockResolvedValue({ months: regularMonths.slice(0, -1), hasMore: false });
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(loadOlderAttendanceMonths).toHaveBeenCalledOnce());
    await waitFor(() => expect(canvasElement.querySelectorAll("[data-month]")).toHaveLength(regularMonths.length));
  },
};
