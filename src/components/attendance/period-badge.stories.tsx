import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PeriodBadge } from "@/components/attendance/period-badge";
import { PERIODS } from "@/lib/attendance/constants";
import { onSurface } from "@/stories/decorators";

// Period badges sit in the day log's table, on a white card.
const meta = {
  title: "Attendance/PeriodBadge",
  component: PeriodBadge,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [onSurface],
  args: { period: "morning" },
} satisfies Meta<typeof PeriodBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Morning: Story = {};
export const Afternoon: Story = { args: { period: "afternoon" } };
export const Evening: Story = { args: { period: "evening" } };
export const AllPeriods: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {PERIODS.map((p) => (
        <PeriodBadge key={p.value} period={p.value} />
      ))}
    </div>
  ),
};
