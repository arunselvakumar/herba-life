import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";
import { DayLog } from "@/components/attendance/day-log";
import { deleteAttendance } from "@/lib/attendance/actions";
import { busyDayRows, todayRows } from "@/stories/fixtures/attendance";
import { daysFromToday, TODAY } from "@/stories/fixtures/time";

const meta = {
  title: "Attendance/DayLog",
  component: DayLog,
  tags: ["autodocs"],
  args: { rows: todayRows, day: TODAY, today: TODAY, canDelete: true },
} satisfies Meta<typeof DayLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Today: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Who came in today")).toBeVisible();
    await expect(canvas.getByText(`${todayRows.length} check-ins, in order of arrival`)).toBeVisible();
  },
};

/** Yesterday, morning to evening, with staff-recorded visits and notes. */
export const BusyDay: Story = { args: { rows: busyDayRows, day: daysFromToday(-1) } };

export const OlderDay: Story = {
  args: { rows: busyDayRows.slice(0, 1), day: daysFromToday(-12) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/^Who came in on /)).toBeVisible();
    await expect(canvas.getByText("1 check-in, in order of arrival")).toBeVisible();
  },
};

export const EmptyDay: Story = {
  args: { rows: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No check-ins recorded.")).toBeVisible();
  },
};

/** Without attendance.delete there is no remove column. */
export const ReadOnly: Story = {
  args: { rows: busyDayRows, day: daysFromToday(-1), canDelete: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  },
};

export const DeleteRow: Story = {
  play: async ({ canvas, userEvent }) => {
    const [first] = todayRows;
    await userEvent.click(canvas.getAllByRole("button", { name: "Remove" })[0] as HTMLElement);
    const dialog = within(document.body).getByRole("dialog", { name: "Remove this check-in?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Remove" }));
    await expect(deleteAttendance).toHaveBeenCalledWith(first?.id);
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

export const KeepRow: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole("button", { name: "Remove" })[0] as HTMLElement);
    const dialog = within(document.body).getByRole("dialog", { name: "Remove this check-in?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Keep" }));
    await expect(deleteAttendance).not.toHaveBeenCalled();
  },
};

export const Mobile: Story = { args: { rows: busyDayRows, day: daysFromToday(-1) }, globals: { viewport: { value: "mobile" } } };
