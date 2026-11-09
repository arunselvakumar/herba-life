import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor } from "storybook/test";
import { PackageForm } from "@/components/members/package-form";
import { createPackage } from "@/lib/members/actions";
import { memberWithEverything, planOptions } from "@/stories/fixtures/members";
import { TODAY } from "@/stories/fixtures/time";

const memberId = memberWithEverything.id;
const oneMonth = planOptions.find((p) => p.durationDays === 30)!;

const meta = {
  title: "Members/PackageForm",
  component: PackageForm,
  tags: ["autodocs"],
  args: {
    action: createPackage.bind(null, memberId),
    today: TODAY,
    cancelHref: `/members/${memberId}`,
    plans: planOptions,
  },
} satisfies Meta<typeof PackageForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Start date")).toHaveValue(TODAY);
    await expect(canvas.getByRole("button", { name: "Enrol in package" })).toBeEnabled();
    await expect(canvas.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", `/members/${memberId}`);
  },
};

/** Nothing in the catalog: a link to create one, and the submit button is disabled. */
export const NoPlans: Story = {
  args: { plans: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/No packages in the catalog yet/)).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Enrol in package" })).toBeDisabled();
  },
};

/** Picking a plan and extra days; the action gets the member id and the fields. */
export const WithPlans: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.selectOptions(canvas.getByLabelText("Package"), oneMonth.id);
    await userEvent.type(canvas.getByLabelText("Extra days"), "5");
    await expect(canvas.getByText(/35 days \(30 \+ 5\)/)).toBeVisible();
    await userEvent.type(canvas.getByLabelText("Advance paid"), "1500");
    await userEvent.type(canvas.getByLabelText("Notes"), "Balance on the 15th.");
    await userEvent.click(canvas.getByRole("button", { name: "Enrol in package" }));

    await waitFor(() => expect(createPackage).toHaveBeenCalledOnce());
    const [id, , data] = mocked(createPackage).mock.calls[0]!;
    await expect(id).toBe(memberId);
    if (!(data instanceof FormData)) throw new Error("createPackage was not called with FormData");
    await expect(data.get("planId")).toBe(oneMonth.id);
    await expect(data.get("startDate")).toBe(TODAY);
    await expect(data.get("extraDays")).toBe("5");
    await expect(data.get("amountPaid")).toBe("1500");
    await expect(data.get("notes")).toBe("Balance on the 15th.");
  },
};

export const Errors: Story = {
  beforeEach: () => {
    mocked(createPackage).mockResolvedValue({
      status: "error",
      message: "The member already has an active package for these dates.",
      errors: { startDate: ["Overlaps the current package, which ends on 7 Jan 2027."] },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.selectOptions(canvas.getByLabelText("Package"), oneMonth.id);
    await userEvent.type(canvas.getByLabelText("Extra days"), "5");
    await userEvent.type(canvas.getByLabelText("Advance paid"), "1500");
    await userEvent.type(canvas.getByLabelText("Notes"), "Balance on the 15th.");
    await userEvent.click(canvas.getByRole("button", { name: "Enrol in package" }));
    await expect(await canvas.findByText("The member already has an active package for these dates.")).toBeVisible();
    await expect(canvas.getByText(/Overlaps the current package/)).toBeVisible();

    // React resets the form after the failed submit; the choices survive it.
    await expect(canvas.getByLabelText("Package")).toHaveValue(oneMonth.id);
    await expect(canvas.getByLabelText("Start date")).toHaveValue(TODAY);
    await expect(canvas.getByLabelText("Extra days")).toHaveValue(5);
    await expect(canvas.getByLabelText("Advance paid")).toHaveValue(1500);
    await expect(canvas.getByLabelText("Notes")).toHaveValue("Balance on the 15th.");
    await expect(canvas.getByText(/35 days \(30 \+ 5\)/)).toBeVisible();

    // Submitting again posts the same plan, not an empty one.
    await userEvent.click(canvas.getByRole("button", { name: "Enrol in package" }));
    await waitFor(() => expect(createPackage).toHaveBeenCalledTimes(2));
    const [first, second] = mocked(createPackage).mock.calls.map((call) => [...(call[2] as FormData).entries()]);
    await expect(second).toEqual(first);
    await expect((mocked(createPackage).mock.calls[1]![2] as FormData).get("planId")).toBe(oneMonth.id);
  },
};
