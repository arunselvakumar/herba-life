import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, waitFor } from "storybook/test";
import { KioskResult } from "@/components/attendance/kiosk-result";
import { KIOSK_WELCOME_SECONDS } from "@/lib/attendance/constants";
import { checkInResults } from "@/stories/fixtures/attendance";
import { knownIssues } from "@/stories/a11y";

// The result covers the whole screen (fixed, inset 0) on the kiosk tablet.
// It fades in, so visibility checks wait for the first frame.
const meta = {
  title: "Attendance/KioskResult",
  component: KioskResult,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // Known issue: on the brand-green success screen the stat tiles' labels
    // (text-white/65 on white/10 over brand-600) measure 3.35:1 and the "Tap
    // anywhere" hint (text-white/60) 3.69:1; on the red error screen "Please
    // tell a staff member" (text-white/70 on destructive) measures 3.4:1. All
    // under the 4.5:1 AA minimum; the tints are set in kiosk-result.tsx, so
    // fixing them is a design change.
    a11y: knownIssues("color-contrast"),
  },
  globals: { viewport: { value: "tablet" } },
  args: {
    result: checkInResults.checkedIn,
    seconds: KIOSK_WELCOME_SECONDS,
    pkg: { name: "3 months", daysLeft: 42 },
    onDismiss: fn(),
  },
} satisfies Meta<typeof KioskResult>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await waitFor(() => expect(canvas.getByRole("heading", { name: "Welcome, Priya!" })).toBeVisible());
    await waitFor(() => expect(canvas.getByText("7th")).toBeVisible());
    await waitFor(() => expect(canvas.getByText("42 days left")).toBeVisible());
    await userEvent.click(canvas.getByRole("button"));
    await expect(args.onDismiss).toHaveBeenCalledOnce();
  },
};

export const FirstVisitOfMonth: Story = {
  args: { result: checkInResults.firstOfMonth },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByText("1st")).toBeVisible());
  },
};

/** The package ends soon: a day or two left, or its last day. */
export const PackageExpiring: Story = {
  args: { pkg: { name: "1 month", daysLeft: 1 } },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByText("1 day left")).toBeVisible());
  },
};

export const PackageLastDay: Story = {
  args: { pkg: { name: "1 month", daysLeft: 0 } },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByText("Last day")).toBeVisible());
  },
};

export const AlreadyInToday: Story = {
  args: { result: checkInResults.already },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByRole("heading", { name: /already in, Priya/ })).toBeVisible());
    await waitFor(() => expect(canvas.getByText("7:42 am")).toBeVisible());
  },
};

/** The package ended since the kiosk loaded its list. */
export const PackageExpired: Story = {
  args: { result: checkInResults.noPackage },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByRole("heading", { name: "No active package, Priya" })).toBeVisible());
  },
};

export const Failed: Story = {
  args: { result: checkInResults.error },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByRole("heading", { name: "Something went wrong" })).toBeVisible());
    await waitFor(() => expect(canvas.getByText(checkInResults.error.message)).toBeVisible());
  },
};

export const Phone: Story = { globals: { viewport: { value: "mobile" } } };
