import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, waitFor } from "storybook/test";
import { MemberRail } from "@/components/attendance/member-rail";
import { kioskMembers, kioskPriya, kioskPriyaNair, kioskRahul, makeKioskMember } from "@/stories/fixtures/attendance";
import { knownIssues } from "@/stories/a11y";

// The rail runs edge to edge under the kiosk's search box. Tests run with
// prefers-reduced-motion, so the belt is built but stays paused: no drift,
// no entrance tween, and clicks land where the pills are drawn.
const meta = {
  title: "Attendance/MemberRail",
  component: MemberRail,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // Known issue: each pill's "#101 · ••2345" line (opacity-60 over the
    // pastel tint) measures 3.8–4.3:1, under the 4.5:1 AA minimum for 12px
    // text. The opacity is set in member-rail.tsx: a design change.
    a11y: knownIssues("color-contrast"),
  },
  decorators: [
    (Story) => (
      <div className="py-8">
        <Story />
      </div>
    ),
  ],
  args: { members: kioskMembers, onPick: fn() },
} satisfies Meta<typeof MemberRail>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A search that leaves a couple of people: they sit centred and the belt doesn't loop. */
export const FewMembers: Story = {
  args: { members: [kioskPriya, kioskPriyaNair] },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("listitem")).toHaveLength(2);
    await waitFor(() => expect(canvas.getByRole("list", { name: "Members" })).toHaveStyle({ justifyContent: "center" }));
    await expect(canvas.getByText("Scroll or drag to browse")).not.toBeVisible();
  },
};

/** The whole list: wider than the screen, so it loops, with arrows to browse. */
export const ManyMembers: Story = {
  play: async ({ canvas, userEvent }) => {
    // The belt measures itself after mounting, then shows its arrows.
    await waitFor(() => expect(canvas.getByText("Scroll or drag to browse")).toBeVisible());
    await userEvent.click(canvas.getByRole("button", { name: "Next members" }));
    await userEvent.click(canvas.getByRole("button", { name: "Previous members" }));
    await expect(canvas.getAllByRole("listitem")).toHaveLength(kioskMembers.length);
  },
};

export const PickMember: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /rahul iyer/i }));
    await expect(args.onPick).toHaveBeenCalledWith(kioskRahul);
  },
};

export const LongNames: Story = {
  args: {
    members: [
      makeKioskMember({ serialNo: 140, firstName: "Venkatalakshmi", lastName: "Ramachandran Subramaniam" }),
      makeKioskMember({ serialNo: 141, firstName: "Jayalakshmi Krishnaswamy", lastName: "Parthasarathy", mobileHint: null }),
    ],
  },
};

export const Tablet: Story = { globals: { viewport: { value: "tablet" } } };
export const Phone: Story = { globals: { viewport: { value: "mobile" } } };
