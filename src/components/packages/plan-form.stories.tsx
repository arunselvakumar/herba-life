import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor } from "storybook/test";
import { PlanForm } from "@/components/packages/plan-form";
import { createPlan } from "@/lib/packages/actions";
import { plans } from "@/stories/fixtures/members";

const threeMonths = plans[1]!;

function submitted(): FormData {
  const data = mocked(createPlan).mock.calls[0]?.[1];
  if (!(data instanceof FormData)) throw new Error("createPlan was not called with FormData");
  return data;
}

const meta = {
  title: "Packages/PlanForm",
  component: PlanForm,
  tags: ["autodocs"],
  args: { action: createPlan, defaults: {}, submitLabel: "Create package" },
} satisfies Meta<typeof PlanForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Name")).toHaveFocus();
    await expect(canvas.getByLabelText("Name")).toHaveValue("");
    await expect(canvas.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/packages");
  },
};

/** The edit page's defaults: the catalog values as strings. */
export const Edit: Story = {
  args: {
    defaults: {
      name: threeMonths.name,
      durationDays: String(threeMonths.durationDays),
      price: String(threeMonths.price),
      description: threeMonths.description ?? "",
      sortOrder: String(threeMonths.sortOrder),
    },
    submitLabel: "Save changes",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Name")).toHaveValue("3 months");
    await expect(canvas.getByLabelText("Duration")).toHaveValue(90);
    await expect(canvas.getByRole("button", { name: "Save changes" })).toBeVisible();
  },
};

export const Submit: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Name"), "12 months");
    await userEvent.type(canvas.getByLabelText("Duration"), "365");
    await userEvent.type(canvas.getByLabelText("Price"), "30000");
    await userEvent.type(canvas.getByLabelText("Description"), "A year of shakes and coaching.");
    await userEvent.click(canvas.getByRole("button", { name: "Create package" }));

    await waitFor(() => expect(createPlan).toHaveBeenCalledOnce());
    const data = submitted();
    await expect(data.get("name")).toBe("12 months");
    await expect(data.get("durationDays")).toBe("365");
    await expect(data.get("price")).toBe("30000");
    await expect(data.get("description")).toBe("A year of shakes and coaching.");
    await expect(data.get("sortOrder")).toBe("");
    await expect(canvas.queryByRole("alert")).toBeNull();
  },
};

export const Errors: Story = {
  beforeEach: () => {
    mocked(createPlan).mockResolvedValue({
      status: "error",
      message: "Please check the form.",
      errors: { name: ["A package called “3 months” already exists."], durationDays: ["Enter the number of days."] },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Name"), "3 months");
    await userEvent.click(canvas.getByRole("button", { name: "Create package" }));
    await expect(await canvas.findByText("Please check the form.")).toBeVisible();
    await expect(canvas.getByText("A package called “3 months” already exists.")).toBeVisible();
    await expect(canvas.getByText("Enter the number of days.")).toBeVisible();
    await expect(canvas.getByLabelText("Name")).toHaveValue("3 months");
  },
};
