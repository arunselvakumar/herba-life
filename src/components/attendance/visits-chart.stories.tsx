import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { VisitsChart } from "@/components/attendance/visits-chart";
import { frame, onSurface } from "@/stories/decorators";
import { dailySeries, monthlySeries, quarterSeries, twoWeekSeries } from "@/stories/fixtures/attendance";
import { daysFromToday, TODAY } from "@/stories/fixtures/time";

const meta = {
  title: "Attendance/VisitsChart",
  component: VisitsChart,
  tags: ["autodocs"],
  decorators: [onSurface, frame("xl")],
  args: { series: dailySeries, unit: "day", selectedKey: TODAY },
} satisfies Meta<typeof VisitsChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default 30-day view: unique members only. */
export const ByDay: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Bar chart of unique members over time" })).toBeVisible();
    await expect(canvas.getByRole("checkbox", { name: "Unique members" })).toBeChecked();
  },
};
export const TwoWeeks: Story = { args: { series: twoWeekSeries } };
export const NinetyDays: Story = { args: { series: quarterSeries } };
export const ByMonth: Story = { args: { series: monthlySeries, unit: "month" } };
/** A past day picked in the day navigator is highlighted in the chart. */
export const SelectedBar: Story = { args: { selectedKey: daysFromToday(-10) } };
export const Empty: Story = { args: { series: dailySeries.map((p) => ({ ...p, visits: 0, members: 0 })) } };

/** Turning check-ins on shows both series; the last one left on can't be turned off. */
export const BothSeries: Story = {
  play: async ({ canvas, userEvent }) => {
    const members = canvas.getByRole("checkbox", { name: "Unique members" });
    const visits = canvas.getByRole("checkbox", { name: "Check-ins" });
    await expect(members).toBeDisabled();
    await userEvent.click(visits);
    await expect(visits).toBeChecked();
    await expect(canvas.getByRole("img", { name: "Bar chart of unique members and check-ins over time" })).toBeVisible();
    await expect(members).toBeEnabled();
  },
};

export const CheckInsOnly: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("checkbox", { name: "Check-ins" }));
    await userEvent.click(canvas.getByRole("checkbox", { name: "Unique members" }));
    await expect(canvas.getByRole("img", { name: "Bar chart of check-ins over time" })).toBeVisible();
    await expect(canvas.getByRole("checkbox", { name: "Check-ins" })).toBeDisabled();
  },
};
