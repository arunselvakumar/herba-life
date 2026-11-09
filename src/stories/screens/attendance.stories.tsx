import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import AttendancePage from "@/app/(app)/attendance/page";
import KioskPage from "@/app/(kiosk)/attendance/kiosk/page";
import { countDay, getAttendanceDashboard, listKioskMembers, listMemberOptions } from "@/lib/attendance/queries";
import { getCurrentUser, getKioskUser } from "@/lib/session";
import { withAppShell, withKioskShell } from "@/stories/decorators";
import { kioskMembers, makeDashboard, makeEmptyDashboard, memberOptions } from "@/stories/fixtures/attendance";
import { daysFromToday } from "@/stories/fixtures/time";
import { frontDeskUser, kioskUser, noRoleUser } from "@/stories/fixtures/users";
import { fullCheck, knownIssues } from "@/stories/a11y";

// Two routes in one file: `/attendance` inside the console shell (the
// default), and `/attendance/kiosk` inside the kiosk layout. Kiosk stories set
// `parameters.shell = "kiosk"` and render the kiosk page instead.
const meta = {
  title: "Screens/Attendance",
  component: AttendancePage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/attendance" } } },
  decorators: [(Story, context) => (context.parameters.shell === "kiosk" ? withKioskShell(Story, context) : withAppShell(Story, context))],
  args: { params: Promise.resolve({}), searchParams: Promise.resolve({}) },
  beforeEach: () => {
    // The page passes the day and range it read from the URL; the fixture follows them.
    mocked(getAttendanceDashboard).mockImplementation(async (day, range) => makeDashboard(day, range));
    mocked(listMemberOptions).mockResolvedValue(memberOptions);
    mocked(listKioskMembers).mockResolvedValue(kioskMembers);
    mocked(countDay).mockResolvedValue({ visits: 23, members: 21 });
    // The kiosk page reads the locked sign-in; the Start screen story unlocks it.
    mocked(getKioskUser).mockResolvedValue(kioskUser);
  },
} satisfies Meta<typeof AttendancePage>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// /attendance
// ---------------------------------------------------------------------------

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Who came in today")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Record a visit" })).toBeVisible();
    // One in the page header, plus the console header's shortcut.
    await expect(canvas.getAllByRole("button", { name: /attendance mode/i }).length).toBeGreaterThan(0);
    await expect(canvas.getByRole("link", { name: "30 days" })).toHaveAttribute("aria-current", "page");
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Who came in today")).toBeVisible();
  },
};

/** `?day=` a day in the past: the log, the stats and the chart's selected bar follow it. */
export const PastDay: Story = {
  args: { searchParams: Promise.resolve({ day: daysFromToday(-1) }) },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Who came in yesterday")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Back to today" })).toBeVisible();
    await expect(getAttendanceDashboard).toHaveBeenCalledWith(daysFromToday(-1), "30d", expect.any(String));
  },
};

/** `?range=12m`: the chart switches to monthly totals. */
export const TwelveMonths: Story = {
  args: { searchParams: Promise.resolve({ range: "12m" }) },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/^Monthly totals for the 12 months to/)).toBeVisible();
    await expect(canvas.getByRole("link", { name: "12 months" })).toHaveAttribute("aria-current", "page");
  },
};

export const PastDayTwoWeeks: Story = {
  args: { searchParams: Promise.resolve({ day: daysFromToday(-12), range: "14d" }) },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/^Who came in on /)).toBeVisible();
    await expect(canvas.getByRole("link", { name: "2 weeks" })).toHaveAttribute("aria-current", "page");
  },
};

/** A future or malformed `?day=` falls back to today. */
export const InvalidDay: Story = {
  args: { searchParams: Promise.resolve({ day: "2030-01-01", range: "bogus" }) },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Who came in today")).toBeVisible();
    await expect(getAttendanceDashboard).toHaveBeenCalledWith(expect.any(String), "30d", expect.any(String));
  },
};

export const NothingRecorded: Story = {
  beforeEach: () => {
    mocked(getAttendanceDashboard).mockImplementation(async (day, range) => makeEmptyDashboard(day, range));
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("No check-ins recorded.")).toBeVisible();
    await expect(canvas.getByText("Everyone on a package has been in recently.")).toBeVisible();
  },
};

/** Front desk: can record and open the kiosk, but not export or remove check-ins. */
export const FrontDesk: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Who came in today")).toBeVisible();
    await expect(canvas.queryByRole("link", { name: /export/i })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  },
};

export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(noRoleUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(getAttendanceDashboard).not.toHaveBeenCalled();
  },
};

// ---------------------------------------------------------------------------
// /attendance/kiosk
// ---------------------------------------------------------------------------

const kiosk = {
  parameters: {
    shell: "kiosk",
    nextjs: { navigation: { pathname: "/attendance/kiosk" } },
    // Known issue: the kiosk header's "Herbalife · Attendance" (text-white/70
    // on brand-600) measures 4.4:1, and the member pills' "#101 · ••2345" line
    // (opacity-60 on pastel tints) 3.8–4.3:1, under the 4.5:1 AA minimum.
    // Colour choices in kiosk.tsx and member-rail.tsx: a design change.
    a11y: knownIssues("color-contrast"),
  },
  render: () => <KioskPage />,
} satisfies Story;

export const Kiosk: Story = {
  ...kiosk,
  globals: { viewport: { value: "tablet" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { name: "Welcome! Tap your name to check in." })).toBeVisible();
    await expect(await canvas.findByRole("button", { name: /priya sharma/i })).toBeVisible();
    await expect(canvas.getByText(/check-ins today/)).toHaveTextContent("23 check-ins today");
    await expect(listKioskMembers).toHaveBeenCalledWith(expect.any(String));
  },
};

export const KioskDesktop: Story = {
  ...kiosk,
  globals: { viewport: { value: "desktop" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("button", { name: /priya sharma/i })).toBeVisible();
  },
};

export const KioskPhone: Story = {
  ...kiosk,
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { name: "Welcome! Tap your name to check in." })).toBeVisible();
  },
};

export const KioskNoMembers: Story = {
  ...kiosk,
  globals: { viewport: { value: "tablet" } },
  beforeEach: () => {
    mocked(listKioskMembers).mockResolvedValue([]);
    mocked(countDay).mockResolvedValue({ visits: 0, members: 0 });
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("No active members yet")).toBeVisible();
  },
};

export const KioskNoAccess: Story = {
  ...kiosk,
  // No kiosk chrome on this one, so the full check applies.
  parameters: { ...kiosk.parameters, a11y: fullCheck },
  globals: { viewport: { value: "tablet" } },
  beforeEach: () => {
    mocked(getKioskUser).mockResolvedValue(noRoleUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(listKioskMembers).not.toHaveBeenCalled();
  },
};

/** Before this device is locked: the Start screen, and no member data loaded. */
export const KioskStart: Story = {
  ...kiosk,
  // No kiosk chrome on this one, so the full check applies.
  parameters: { ...kiosk.parameters, a11y: fullCheck },
  globals: { viewport: { value: "tablet" } },
  beforeEach: () => {
    mocked(getKioskUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { name: "Start Attendance Mode" })).toBeVisible();
    await expect(canvas.getByText(frontDeskUser.name)).toBeVisible();
    await expect(listKioskMembers).not.toHaveBeenCalled();
    await expect(countDay).not.toHaveBeenCalled();
  },
};
