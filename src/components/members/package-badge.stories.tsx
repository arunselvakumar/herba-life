import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PackageBadge } from "@/components/members/package-badge";
import { onSurface } from "@/stories/decorators";

// Package badges always sit on a white card (tables, the member page), so the
// stories do too: the contrast check measures against the real background.
const meta = {
  title: "Members/PackageBadge",
  component: PackageBadge,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [onSurface],
  args: { state: "active" },
} satisfies Meta<typeof PackageBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {};
export const EndingSoon: Story = { args: { state: "expiring" } };
export const Upcoming: Story = { args: { state: "upcoming" } };
export const Expired: Story = { args: { state: "expired" } };
export const Completed: Story = { args: { state: "completed" } };
export const Cancelled: Story = { args: { state: "cancelled" } };
export const NoPackage: Story = { args: { state: null } };
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(["active", "expiring", "upcoming", "expired", "completed", "cancelled", null] as const).map((state) => (
        <PackageBadge key={String(state)} state={state} />
      ))}
    </div>
  ),
};
