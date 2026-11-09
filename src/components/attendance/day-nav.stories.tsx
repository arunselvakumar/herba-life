import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { expect, waitFor, within } from "storybook/test";
import { DayNav } from "@/components/attendance/day-nav";
import { daysFromToday, TODAY } from "@/stories/fixtures/time";

const meta = {
  title: "Attendance/DayNav",
  component: DayNav,
  tags: ["autodocs"],
  parameters: { nextjs: { navigation: { pathname: "/attendance" } } },
  args: { day: TODAY, today: TODAY, range: "30d" },
} satisfies Meta<typeof DayNav>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Today: no "next day", no "back to today". */
export const Today: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Next day" })).toBeDisabled();
    await expect(canvas.queryByRole("button", { name: "Back to today" })).not.toBeInTheDocument();
  },
};

export const Yesterday: Story = { args: { day: daysFromToday(-1) } };

export const PastDay: Story = {
  args: { day: daysFromToday(-12) },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Back to today" }));
    await expect(getRouter().push).toHaveBeenCalledWith("/attendance");
  },
};

export const PreviousDay: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Previous day" }));
    await expect(getRouter().push).toHaveBeenCalledWith(`/attendance?day=${daysFromToday(-1)}`);
  },
};

/** A non-default chart range travels along in the URL. */
export const WeekRange: Story = {
  args: { day: daysFromToday(-3), range: "14d" },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Next day" }));
    await expect(getRouter().push).toHaveBeenCalledWith(`/attendance?day=${daysFromToday(-2)}&range=14d`);
  },
};

/** The calendar popover, with its shortcuts. */
export const MonthRange: Story = {
  args: { range: "12m" },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /pick a day/i }));
    const popover = within(document.body).getByRole("dialog");
    await waitFor(() => expect(within(popover).getByRole("grid")).toBeVisible());
    await userEvent.click(within(popover).getByRole("button", { name: "A week ago" }));
    await expect(getRouter().push).toHaveBeenCalledWith(`/attendance?day=${daysFromToday(-7)}&range=12m`);
  },
};

export const Mobile: Story = { args: { day: daysFromToday(-12) }, globals: { viewport: { value: "mobile" } } };
