import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor, within } from "storybook/test";
import { RecordAttendanceDialog } from "@/components/attendance/record-attendance-dialog";
import { recordAttendance } from "@/lib/attendance/actions";
import { kioskRahul, memberOptions } from "@/stories/fixtures/attendance";
import { daysFromToday, TODAY } from "@/stories/fixtures/time";

const meta = {
  title: "Attendance/RecordAttendanceDialog",
  component: RecordAttendanceDialog,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { members: memberOptions, day: TODAY, today: TODAY },
} satisfies Meta<typeof RecordAttendanceDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

/** Today: the time defaults to now on the branch clock (10:30). */
export const Open: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Record a visit" }));
    const dialog = within(document.body).getByRole("dialog", { name: "Record a visit" });
    await expect(within(dialog).getByLabelText(/^Day/)).toHaveValue(TODAY);
    await expect(within(dialog).getByLabelText(/^Time/)).toHaveValue("10:30");
  },
};

/** A past day starts at 9:00 instead. */
export const PastDay: Story = {
  args: { day: daysFromToday(-3) },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Record a visit" }));
    const dialog = within(document.body).getByRole("dialog", { name: "Record a visit" });
    await expect(within(dialog).getByLabelText(/^Day/)).toHaveValue(daysFromToday(-3));
    await expect(within(dialog).getByLabelText(/^Time/)).toHaveValue("09:00");
  },
};

export const RecordAMember: Story = {
  beforeEach: () => {
    mocked(recordAttendance).mockResolvedValue({ status: "success", message: "Rahul Iyer marked present at 10:30 am." });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Record a visit" }));
    const dialog = within(document.body).getByRole("dialog", { name: "Record a visit" });
    await userEvent.selectOptions(within(dialog).getByLabelText(/^Member/), kioskRahul.id);
    await userEvent.type(within(dialog).getByLabelText(/^Note/), "Tablet was off");
    await userEvent.click(within(dialog).getByRole("button", { name: "Mark present" }));
    await waitFor(() => expect(recordAttendance).toHaveBeenCalled());
    const formData = mocked(recordAttendance).mock.calls[0]?.[1];
    await expect(formData?.get("memberId")).toBe(kioskRahul.id);
    await expect(formData?.get("note")).toBe("Tablet was off");
    await expect(await within(dialog).findByText("Rahul Iyer marked present at 10:30 am.")).toBeVisible();
  },
};

export const ValidationError: Story = {
  beforeEach: () => {
    mocked(recordAttendance).mockResolvedValue({
      status: "error",
      errors: {
        memberId: ["Choose a member."],
        _form: ["Priya Nair has no active package on that day."],
      },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Record a visit" }));
    const dialog = within(document.body).getByRole("dialog", { name: "Record a visit" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Mark present" }));
    await expect(await within(dialog).findByText("Choose a member.")).toBeVisible();
    await expect(within(dialog).getByText("Priya Nair has no active package on that day.")).toBeVisible();
  },
};

export const NoMembers: Story = { args: { members: [] } };
