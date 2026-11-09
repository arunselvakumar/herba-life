import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";
import { MemberForm } from "@/components/members/member-form";
import { createMember } from "@/lib/members/actions";
import { formatDay } from "@/lib/members/dates";
import { memberToDefaults } from "@/lib/members/form-defaults";
import type { FormAction, FormState } from "@/lib/members/form-state";
import { memberWithHealth, planOptions } from "@/stories/fixtures/members";
import { TODAY } from "@/stories/fixtures/time";

const threeMonths = planOptions.find((p) => p.durationDays === 90)!;

/** The FormData of the n-th call to the mocked `createMember`. */
function submitted(call = 0): FormData {
  const data = mocked(createMember).mock.calls[call]?.[1];
  if (!(data instanceof FormData)) throw new Error("createMember was not called with FormData");
  return data;
}

const meta = {
  title: "Members/MemberForm",
  component: MemberForm,
  tags: ["autodocs"],
  args: {
    mode: "create",
    action: createMember,
    defaults: { joinedOn: TODAY },
    today: TODAY,
    cancelHref: "/members",
    plans: planOptions,
  },
} satisfies Meta<typeof MemberForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Intake: personal details, baseline measurements, habits, health, optional package. */
export const Create: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("First name")).toHaveFocus();
    await expect(canvas.getByText("Measurements at enrolment")).toBeVisible();
    await expect(canvas.getByLabelText("Joined on")).toHaveValue(TODAY);
    await expect(canvas.getByText(/add a package later/)).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/members");
  },
};

/** Ticking "Start a package now" shows the catalog picker; the start date follows the join date. */
export const WithPackage: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("checkbox", { name: "Start a package now" }));
    await expect(canvas.getByText("follows join date")).toBeVisible();
    await expect(canvas.getByLabelText("Start date")).toHaveValue(TODAY);
    await expect(canvas.getByText("Choose a package and start date")).toBeVisible();

    await userEvent.selectOptions(canvas.getByLabelText("Package"), threeMonths.id);
    await expect(canvas.getByText(threeMonths.description!)).toBeVisible();
    await expect(canvas.getByText(formatDay("2027-02-06"))).toBeVisible();

    await userEvent.type(canvas.getByLabelText("Extra days"), "7");
    await expect(canvas.getByText(/97 days \(90 \+ 7\)/)).toBeVisible();
  },
};

export const NoPlansInCatalog: Story = {
  args: { plans: [] },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("checkbox", { name: "Start a package now" }));
    await expect(canvas.getByText(/No packages in the catalog yet/)).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Create one under Packages" })).toHaveAttribute("href", "/packages/new");
  },
};

/** A date of birth fills the age, so the age field is disabled. */
export const AgeFromDateOfBirth: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Date of birth"), "1990-01-15");
    await expect(canvas.getByText("36 years")).toBeVisible();
    await expect(canvas.getByLabelText("Age")).toBeDisabled();
  },
};

/** Editing: the record's values, height only (follow-ups are recorded on the profile), no package section. */
export const Edit: Story = {
  args: {
    mode: "edit",
    defaults: memberToDefaults(memberWithHealth),
    cancelHref: `/members/${memberWithHealth.id}`,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("First name")).toHaveValue("Priya");
    await expect(canvas.getByLabelText("Height")).toHaveValue(162);
    await expect(canvas.getByRole("checkbox", { name: "Blood pressure" })).toBeChecked();
    await expect(canvas.getByRole("checkbox", { name: "Pain" })).toBeChecked();
    await expect(canvas.getByText("Where is the pain?")).toBeVisible();
    await expect(canvas.getByRole("checkbox", { name: "Knee" })).toBeChecked();
    await expect(canvas.queryByText("Start a package now")).toBeNull();
    await expect(canvas.getByRole("button", { name: "Save changes" })).toBeEnabled();
  },
};

export const CustomSubmitLabel: Story = {
  args: { submitLabel: "Convert to member" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Convert to member" })).toBeVisible();
  },
};

/** The server rejects the submit: a summary, per-field messages, and what was typed is kept. */
export const ValidationErrors: Story = {
  beforeEach: () => {
    mocked(createMember).mockResolvedValue({
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: { firstName: ["Enter the member's first name."], mobile: ["Enter a 10-digit mobile number."] },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Last name"), "Sharma");
    await userEvent.type(canvas.getByLabelText("Mobile"), "12345");
    await userEvent.selectOptions(canvas.getByLabelText("Gender"), "female");
    await userEvent.click(canvas.getByRole("checkbox", { name: "Sugar / diabetes" }));
    await userEvent.click(canvas.getByRole("checkbox", { name: "Headache" }));
    await userEvent.click(canvas.getByRole("checkbox", { name: "Start a package now" }));
    await userEvent.selectOptions(canvas.getByLabelText("Package"), threeMonths.id);
    await userEvent.click(canvas.getByRole("button", { name: "Save member" }));

    await expect(await canvas.findByText("Please fix the highlighted fields.")).toBeVisible();
    await expect(canvas.getByText("Enter the member's first name.")).toBeVisible();
    await expect(canvas.getByText("Enter a 10-digit mobile number.")).toBeVisible();
    await expect(canvas.getByLabelText("Mobile")).toHaveValue("12345");
    await expect(canvas.getByLabelText("Last name")).toHaveValue("Sharma");
    await expect(submitted().get("firstName")).toBe("");

    // React resets the form after the failed submit; selects and ticks survive it too.
    await expect(canvas.getByLabelText("Gender")).toHaveValue("female");
    await expect(canvas.getByRole("checkbox", { name: "Sugar / diabetes" })).toBeChecked();
    await expect(canvas.getByRole("checkbox", { name: "Headache" })).toBeChecked();
    await expect(canvas.getByRole("checkbox", { name: "Start a package now" })).toBeChecked();
    await expect(canvas.getByLabelText("Package")).toHaveValue(threeMonths.id);

    // Submitting again posts exactly what is on screen.
    await userEvent.click(canvas.getByRole("button", { name: "Save member" }));
    await waitFor(() => expect(createMember).toHaveBeenCalledTimes(2));
    await expect([...submitted(1).entries()]).toEqual([...submitted(0).entries()]);
    await expect(submitted(1).get("package.planId")).toBe(threeMonths.id);
    await expect(submitted(1).get("hasSugar")).toBe("on");
  },
};

/** A full intake: the action receives every field, including the baseline reading and the package. */
export const Submit: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("First name"), "Anjali");
    await userEvent.type(canvas.getByLabelText("Last name"), "Menon");
    await userEvent.selectOptions(canvas.getByLabelText("Gender"), "female");
    await userEvent.type(canvas.getByLabelText("Mobile"), "98410 55667");
    await userEvent.type(canvas.getByLabelText("Weight"), "72.5");
    await userEvent.click(canvas.getByRole("checkbox", { name: "Sugar / diabetes" }));
    await userEvent.click(canvas.getByRole("checkbox", { name: "Headache" }));
    await userEvent.click(canvas.getByRole("checkbox", { name: "Start a package now" }));
    await userEvent.selectOptions(canvas.getByLabelText("Package"), threeMonths.id);
    await userEvent.type(canvas.getByLabelText("Advance paid"), "5000");
    await userEvent.click(canvas.getByRole("button", { name: "Save member" }));

    await waitFor(() => expect(createMember).toHaveBeenCalledOnce());
    const data = submitted();
    await expect(data.get("firstName")).toBe("Anjali");
    await expect(data.get("lastName")).toBe("Menon");
    await expect(data.get("gender")).toBe("female");
    await expect(data.get("joinedOn")).toBe(TODAY);
    await expect(data.get("baseline.weightKg")).toBe("72.5");
    await expect(data.get("hasSugar")).toBe("on");
    await expect(data.getAll("symptoms[]")).toEqual(["headache"]);
    await expect(data.get("package.enabled")).toBe("on");
    await expect(data.get("package.planId")).toBe(threeMonths.id);
    await expect(data.get("package.startDate")).toBe(TODAY);
    await expect(data.get("package.amountPaid")).toBe("5000");
    await expect(canvas.queryByRole("alert")).toBeNull();
  },
};

/** While the action runs, the submit button is disabled and shows a spinner. */
export const Saving: Story = {
  args: { action: fn<FormAction>(() => new Promise<FormState>(() => {})) },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("First name"), "Anjali");
    await userEvent.click(canvas.getByRole("button", { name: "Save member" }));
    await waitFor(() => expect(canvas.getByRole("button", { name: "Save member" })).toBeDisabled());
  },
};
