import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import { InquiryForm } from "@/components/inquiries/inquiry-form";
import { createInquiry, updateInquiry } from "@/lib/inquiries/actions";
import { inquiryToDefaults } from "@/lib/inquiries/form-defaults";
import { frame } from "@/stories/decorators";
import { activePlans, memberOptions, openInquiry, staff } from "@/stories/fixtures/inquiries";
import { TODAY } from "@/stories/fixtures/time";
import { adminUser } from "@/stories/fixtures/users";
import { knownIssues } from "@/stories/a11y";

// Each section of the form is its own card, so it sits straight on the page canvas.
const meta = {
  title: "Inquiries/InquiryForm",
  component: InquiryForm,
  parameters: {
    layout: "padded",
    // Known issue: the "Goals" checkboxes (and the symptom checkboxes in the
    // health section) are 18px squares from ui/checkbox, 8px apart in the
    // CheckRow grid, so axe's target-size (WCAG 2.5.8) measures 21.4px of safe
    // space against 24px. Fixing it means resizing the shared checkbox or its
    // row, a design change outside these stories.
    a11y: knownIssues("target-size"),
  },
  tags: ["autodocs"],
  decorators: [frame("xl")],
  args: {
    mode: "create",
    action: createInquiry,
    // What the "New enquiry" page passes.
    defaults: { inquiredOn: TODAY, source: "walk_in", assignedTo: adminUser.id },
    today: TODAY,
    cancelHref: "/inquiries",
    plans: activePlans,
    staff,
    members: memberOptions,
  },
} satisfies Meta<typeof InquiryForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("First name")).toHaveFocus();
    await expect(canvas.getByLabelText("Enquired on")).toHaveValue(TODAY);
    await expect(canvas.getByLabelText("Assigned to")).toHaveValue(adminUser.id);
    await expect(canvas.getByRole("button", { name: "Save enquiry" })).toBeEnabled();
    await expect(canvas.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/inquiries");
  },
};

export const SubmitNew: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("First name"), "Anjali");
    await userEvent.type(canvas.getByLabelText("Mobile"), "98410 55201");
    await userEvent.selectOptions(canvas.getByLabelText("Source"), "phone");
    await userEvent.click(canvas.getByLabelText("Weight loss"));
    await userEvent.selectOptions(canvas.getByLabelText("Interested package"), activePlans[1]!.id);
    // The chosen package's description appears under the picker.
    await expect(canvas.getByText(activePlans[1]!.description!)).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Save enquiry" }));

    await expect(createInquiry).toHaveBeenCalledOnce();
    const formData = mocked(createInquiry).mock.calls[0]![1];
    await expect(formData.get("firstName")).toBe("Anjali");
    await expect(formData.get("mobile")).toBe("98410 55201");
    await expect(formData.get("source")).toBe("phone");
    await expect(formData.getAll("goals[]")).toEqual(["weight_loss"]);
    await expect(formData.get("interestedPlanId")).toBe(activePlans[1]!.id);
    // A successful save redirects; until then there is no error banner.
    await expect(canvas.queryByText("Please fix the highlighted fields.")).not.toBeInTheDocument();
  },
};

export const AgeFromDateOfBirth: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Date of birth"), "1990-11-10");
    // A date of birth makes the age field derived, so it can't be typed.
    await expect(canvas.getByText("35 years")).toBeVisible();
    await expect(canvas.getByLabelText("Age")).toBeDisabled();
  },
};

export const Edit: Story = {
  args: {
    mode: "edit",
    action: updateInquiry.bind(null, openInquiry.id),
    defaults: inquiryToDefaults(openInquiry),
    cancelHref: `/inquiries/${openInquiry.id}`,
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByLabelText("First name")).toHaveValue("Kavitha");
    await expect(canvas.getByLabelText("Weight loss")).toBeChecked();
    await expect(canvas.getByLabelText("Interested package")).toHaveValue(openInquiry.interestedPlanId);

    const remarks = canvas.getByLabelText("Remarks");
    await userEvent.clear(remarks);
    await userEvent.type(remarks, "Ready to join next month.");
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));

    await expect(updateInquiry).toHaveBeenCalledOnce();
    const [inquiryId, , formData] = mocked(updateInquiry).mock.calls[0]!;
    await expect(inquiryId).toBe(openInquiry.id);
    await expect(formData.get("remarks")).toBe("Ready to join next month.");
    await expect(formData.get("firstName")).toBe("Kavitha");
  },
};

export const LinkedMember: Story = {
  args: {
    defaults: {
      inquiredOn: TODAY,
      source: "referral",
      assignedTo: adminUser.id,
      referredByMemberId: memberOptions[0]!.id,
      referredBy: "Priya Sharma",
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Source")).toHaveValue("referral");
    // A referral asks for the referrer's name.
    await expect(canvas.getByText("name of the referrer")).toBeVisible();
    await expect(canvas.getByLabelText("Referring member")).toHaveValue(memberOptions[0]!.id);
    await expect(canvas.getByRole("option", { name: "#101 · Priya Sharma" })).toHaveProperty("selected", true);
  },
};

export const NoStaffOrMembers: Story = {
  args: { staff: [], members: [], plans: [], defaults: { inquiredOn: TODAY, source: "walk_in" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Assigned to")).toHaveValue("");
    await expect(canvas.getByLabelText("Referring member")).toHaveValue("");
    await expect(canvas.getByLabelText("Interested package")).toHaveValue("");
  },
};

export const Errors: Story = {
  beforeEach: () => {
    mocked(createInquiry).mockResolvedValue({
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: {
        firstName: ["First name is required"],
        email: ["Enter a valid email"],
        heightCm: ["Too small"],
      },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Email"), "kavitha@");
    await userEvent.type(canvas.getByLabelText("Height"), "12");
    await userEvent.selectOptions(canvas.getByLabelText("Source"), "phone");
    await userEvent.selectOptions(canvas.getByLabelText("Gender"), "female");
    await userEvent.click(canvas.getByLabelText("Weight loss"));
    await userEvent.selectOptions(canvas.getByLabelText("Interested package"), activePlans[1]!.id);
    await userEvent.click(canvas.getByRole("button", { name: "Save enquiry" }));

    await expect(createInquiry).toHaveBeenCalled();
    await expect(await canvas.findByText("Please fix the highlighted fields.")).toBeVisible();
    await expect(canvas.getByText("First name is required")).toBeVisible();
    await expect(canvas.getByText("Enter a valid email")).toBeVisible();
    await expect(canvas.getByText("Too small")).toBeVisible();
    // React resets the form after the failed submit; everything entered survives it.
    await expect(canvas.getByLabelText("Email")).toHaveValue("kavitha@");
    await expect(canvas.getByLabelText("Source")).toHaveValue("phone");
    await expect(canvas.getByLabelText("Gender")).toHaveValue("female");
    await expect(canvas.getByLabelText("Weight loss")).toBeChecked();
    await expect(canvas.getByLabelText("Interested package")).toHaveValue(activePlans[1]!.id);
    await expect(canvas.getByText(activePlans[1]!.description!)).toBeVisible();

    // Submitting again posts exactly what is on screen.
    await userEvent.click(canvas.getByRole("button", { name: "Save enquiry" }));
    await expect(createInquiry).toHaveBeenCalledTimes(2);
    const [first, second] = mocked(createInquiry).mock.calls.map((call) => [...call[1].entries()]);
    await expect(second).toEqual(first);
    await expect(mocked(createInquiry).mock.calls[1]![1].get("source")).toBe("phone");
    await expect(mocked(createInquiry).mock.calls[1]![1].getAll("goals[]")).toEqual(["weight_loss"]);
  },
};
