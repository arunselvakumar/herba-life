import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor } from "storybook/test";
import { CheckinForm } from "@/components/members/checkin-form";
import { addCheckin } from "@/lib/members/actions";
import { memberWithEverything } from "@/stories/fixtures/members";
import { TODAY } from "@/stories/fixtures/time";

const memberId = memberWithEverything.id;

/** The FormData the mocked `addCheckin` received (bound to the member id, so it's the third argument). */
function submitted(): FormData {
  const call = mocked(addCheckin).mock.calls[0];
  if (!call || !(call[2] instanceof FormData)) throw new Error("addCheckin was not called with FormData");
  return call[2];
}

const meta = {
  title: "Members/CheckinForm",
  component: CheckinForm,
  tags: ["autodocs"],
  args: { action: addCheckin.bind(null, memberId), today: TODAY, heightCm: null },
} satisfies Meta<typeof CheckinForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No height on the profile, so no BMI is suggested. */
export const Empty: Story = {
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByLabelText("Visit date")).toHaveValue(TODAY);
    await userEvent.type(canvas.getByLabelText("Weight"), "68.4");
    await expect(canvas.queryByRole("button", { name: /^Use / })).toBeNull();
  },
};

/** With the member's height, typing a weight offers the computed BMI. */
export const WithHeight: Story = {
  args: { heightCm: 162 },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Weight"), "68.4");
    const suggestion = canvas.getByRole("button", { name: "Use 26.1 from height 162 cm" });
    await userEvent.click(suggestion);
    await expect(canvas.getByLabelText("BMI")).toHaveValue(26.1);
    await expect(canvas.queryByRole("button", { name: /^Use / })).toBeNull();
  },
};

export const Submit: Story = {
  args: { heightCm: 162 },
  beforeEach: () => {
    mocked(addCheckin).mockResolvedValue({ status: "success", message: "Follow-up saved." });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Weight"), "67.9");
    await userEvent.type(canvas.getByLabelText("Body fat"), "30.4");
    await userEvent.type(canvas.getByLabelText("Remarks"), "Feeling lighter, sleeping better.");
    await userEvent.click(canvas.getByRole("button", { name: "Save follow-up" }));

    await expect(await canvas.findByText("Follow-up saved.")).toBeVisible();
    await expect(mocked(addCheckin).mock.calls[0]?.[0]).toBe(memberId);
    const data = submitted();
    await expect(data.get("recordedOn")).toBe(TODAY);
    await expect(data.get("weightKg")).toBe("67.9");
    await expect(data.get("bodyFatPct")).toBe("30.4");
    await expect(data.get("bmi")).toBe("");
    await expect(data.get("remarks")).toBe("Feeling lighter, sleeping better.");
  },
};

/** A form-level error (`_form`) wins over the message; field errors show under each input. */
export const Errors: Story = {
  beforeEach: () => {
    mocked(addCheckin).mockResolvedValue({
      status: "error",
      message: "Please check the form.",
      errors: {
        _form: ["Enter at least one reading."],
        recordedOn: ["The visit date can't be in the future."],
        weightKg: ["Weight must be between 20 and 300 kg."],
      },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Weight"), "900");
    await userEvent.click(canvas.getByRole("button", { name: "Save follow-up" }));
    await expect(await canvas.findByText("Enter at least one reading.")).toBeVisible();
    await expect(canvas.queryByText("Please check the form.")).toBeNull();
    await expect(canvas.getByText("The visit date can't be in the future.")).toBeVisible();
    await expect(canvas.getByText("Weight must be between 20 and 300 kg.")).toBeVisible();
    await waitFor(() => expect(canvas.getByLabelText("Weight")).toHaveValue(900));
  },
};
