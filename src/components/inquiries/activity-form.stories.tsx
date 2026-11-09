import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import { ActivityForm } from "@/components/inquiries/activity-form";
import { addActivity } from "@/lib/inquiries/actions";
import { frame } from "@/stories/decorators";
import { openInquiry } from "@/stories/fixtures/inquiries";
import { daysFromToday, TODAY } from "@/stories/fixtures/time";

// The form brings its own card, so it sits straight on the page canvas.
const meta = {
  title: "Inquiries/ActivityForm",
  component: ActivityForm,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [frame("lg")],
  // The detail page binds the inquiry id, exactly as here.
  args: { action: addActivity.bind(null, openInquiry.id), today: TODAY, nextFollowUpOn: null },
} satisfies Meta<typeof ActivityForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("What")).toHaveValue("call");
    await expect(canvas.getByLabelText("On")).toHaveValue(TODAY);
    await expect(canvas.getByLabelText("Next follow-up")).toHaveValue("");
  },
};

export const WithNextFollowUp: Story = {
  args: { nextFollowUpOn: daysFromToday(3) },
  play: async ({ canvas }) => {
    // The current reminder is the default, so staff can keep or move it.
    await expect(canvas.getByLabelText("Next follow-up")).toHaveValue(daysFromToday(3));
  },
};

export const LogAFollowUp: Story = {
  args: { nextFollowUpOn: daysFromToday(-3) },
  beforeEach: () => {
    mocked(addActivity).mockResolvedValue({ status: "success", message: "Logged. Next follow-up scheduled." });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.selectOptions(canvas.getByLabelText("What"), "whatsapp");
    const next = canvas.getByLabelText("Next follow-up");
    await userEvent.clear(next);
    await userEvent.type(next, daysFromToday(2));
    await userEvent.type(canvas.getByLabelText("Notes"), "Sent the price list again.");
    await userEvent.click(canvas.getByRole("button", { name: "Save follow-up" }));

    await expect(addActivity).toHaveBeenCalledOnce();
    const [inquiryId, , formData] = mocked(addActivity).mock.calls[0]!;
    await expect(inquiryId).toBe(openInquiry.id);
    await expect(formData.get("type")).toBe("whatsapp");
    await expect(formData.get("occurredOn")).toBe(TODAY);
    await expect(formData.get("nextFollowUpOn")).toBe(daysFromToday(2));
    await expect(formData.get("notes")).toBe("Sent the price list again.");
    await expect(await canvas.findByText("Logged. Next follow-up scheduled.")).toBeVisible();
  },
};

export const NoteHasItsOwnPrompt: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.selectOptions(canvas.getByLabelText("What"), "note");
    await expect(canvas.getByLabelText("Notes")).toHaveAttribute("placeholder", "What to remember");
  },
};

export const ValidationErrors: Story = {
  beforeEach: () => {
    mocked(addActivity).mockResolvedValue({
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: { occurredOn: ["Enter a valid date"], nextFollowUpOn: ["Enter a valid date"] },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Notes"), "Called, no answer");
    await userEvent.click(canvas.getByRole("button", { name: "Save follow-up" }));

    await expect(addActivity).toHaveBeenCalled();
    await expect(await canvas.findByText("Please fix the highlighted fields.")).toBeVisible();
    await expect(canvas.getAllByRole("alert").filter((a) => a.textContent === "Enter a valid date")).toHaveLength(2);
    // What was typed survives the failed submit.
    await expect(canvas.getByLabelText("Notes")).toHaveValue("Called, no answer");
  },
};

export const NoteNeedsText: Story = {
  beforeEach: () => {
    mocked(addActivity).mockResolvedValue({ status: "error", errors: { notes: ["Write the note."] } });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.selectOptions(canvas.getByLabelText("What"), "note");
    await userEvent.click(canvas.getByRole("button", { name: "Save follow-up" }));
    // No message from the action, so the banner falls back to a generic one.
    await expect(await canvas.findByText("Please check the form.")).toBeVisible();
    await expect(canvas.getByText("Write the note.")).toBeVisible();
    // Known issue: React resets the form after the failed submit, so the
    // controlled "What" select shows "Phone call" again while its state is
    // still "note". Not asserted here until the component is fixed.
  },
};

export const EnquiryClosed: Story = {
  beforeEach: () => {
    mocked(addActivity).mockResolvedValue({ status: "error", message: "This enquiry is closed. Reopen it to make changes.", errors: {} });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save follow-up" }));
    await expect(await canvas.findByText("This enquiry is closed. Reopen it to make changes.")).toBeVisible();
  },
};

export const FormLevelError: Story = {
  beforeEach: () => {
    mocked(addActivity).mockResolvedValue({ status: "error", message: "Ignored when there is a form error.", errors: { _form: ["Could not save. Try again."] } });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save follow-up" }));
    await expect(await canvas.findByText("Could not save. Try again.")).toBeVisible();
    await expect(canvas.queryByText("Ignored when there is a form error.")).not.toBeInTheDocument();
  },
};
