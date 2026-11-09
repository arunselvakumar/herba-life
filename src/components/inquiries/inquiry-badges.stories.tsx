import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { FollowUpDue, InquiryStatusBadge } from "@/components/inquiries/inquiry-badges";
import { INQUIRY_STATUSES } from "@/lib/inquiries/constants";
import { onSurface } from "@/stories/decorators";
import { daysFromToday, TODAY } from "@/stories/fixtures/time";

// Both badges sit on white cards (the enquiry table, the detail page), so the
// stories do too: the contrast check measures against the real background.
const meta = {
  title: "Inquiries/Badges",
  component: InquiryStatusBadge,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [onSurface],
  args: { status: "new" },
} satisfies Meta<typeof InquiryStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const New: Story = {};
export const InProgress: Story = { args: { status: "in_progress" } };
export const Converted: Story = { args: { status: "converted" } };
export const Lost: Story = { args: { status: "lost" } };

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {INQUIRY_STATUSES.map((s) => (
        <InquiryStatusBadge key={s.value} status={s.value} />
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for (const label of ["New", "In progress", "Converted", "Lost"]) {
      await expect(canvas.getByText(label)).toBeVisible();
    }
  },
};

export const FollowUpOverdue: Story = {
  render: () => <FollowUpDue nextFollowUpOn={daysFromToday(-3)} today={TODAY} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/3 days overdue/)).toBeVisible();
  },
};

export const FollowUpOneDayOverdue: Story = {
  render: () => <FollowUpDue nextFollowUpOn={daysFromToday(-1)} today={TODAY} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/1 day overdue/)).toBeVisible();
  },
};

export const FollowUpToday: Story = {
  render: () => <FollowUpDue nextFollowUpOn={TODAY} today={TODAY} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Today/)).toBeVisible();
  },
};

export const FollowUpUpcoming: Story = {
  render: () => <FollowUpDue nextFollowUpOn={daysFromToday(4)} today={TODAY} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/In 4 days/)).toBeVisible();
  },
};

export const FollowUpNotScheduled: Story = {
  render: () => <FollowUpDue nextFollowUpOn={null} today={TODAY} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Not scheduled")).toBeVisible();
  },
};

export const FollowUpAllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <FollowUpDue nextFollowUpOn={daysFromToday(-3)} today={TODAY} />
      <FollowUpDue nextFollowUpOn={TODAY} today={TODAY} />
      <FollowUpDue nextFollowUpOn={daysFromToday(4)} today={TODAY} />
      <FollowUpDue nextFollowUpOn={null} today={TODAY} />
    </div>
  ),
};
