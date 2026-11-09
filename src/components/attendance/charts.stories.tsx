import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { BarChart, HourChart, WeekdayChart, type Bar } from "@/components/attendance/charts";
import { frame, onSurface } from "@/stories/decorators";
import { byHour, byWeekday } from "@/stories/fixtures/attendance";

const bars: Bar[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, i) => {
  const value = [18, 22, 15, 26, 24, 11, 0][i] ?? 0;
  return { key: label, label, value, secondary: Math.round(value * 0.7), selected: i === 3, title: `${label}: ${value} check-ins` };
});

const meta = {
  title: "Attendance/Charts",
  component: BarChart,
  tags: ["autodocs"],
  decorators: [onSurface, frame("lg")],
  args: { bars, ariaLabel: "Bar chart of check-ins this week" },
} satisfies Meta<typeof BarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Bars: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Bar chart of check-ins this week" })).toBeVisible();
  },
};
export const AccentTone: Story = { args: { tone: "accent" } };
export const WithSecondary: Story = { args: { showSecondary: true } };
export const AllZero: Story = { args: { bars: bars.map((b) => ({ ...b, value: 0, secondary: 0, title: `${b.label}: 0 check-ins` })) } };
/** Large values pick a rounded top for the axis. */
export const LargeValues: Story = { args: { bars: bars.map((b) => ({ ...b, value: b.value * 37 })) } };

export const Hours: Story = {
  render: () => <HourChart byHour={byHour} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: /by hour of day/i })).toBeVisible();
    await expect(canvas.getByText("6am")).toBeInTheDocument();
  },
};
/** No check-ins at all: the axis still spans 6am to 9pm. */
export const HoursEmpty: Story = { render: () => <HourChart byHour={byHour.map(() => 0)} /> };
export const Weekdays: Story = {
  render: () => <WeekdayChart byWeekday={byWeekday} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: /by weekday/i })).toBeVisible();
    await expect(canvas.getByText("Sun")).toBeInTheDocument();
  },
};
