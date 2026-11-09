import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { PackageFields } from "@/components/members/package-fields";
import { formatDay } from "@/lib/members/dates";
import { formatMoney } from "@/lib/members/format";
import { idleState, makeValueReader } from "@/lib/members/form-state";
import { onSurface } from "@/stories/decorators";
import { planOptions } from "@/stories/fixtures/members";
import { daysFromToday, TODAY } from "@/stories/fixtures/time";

const threeMonths = planOptions.find((p) => p.durationDays === 90)!;

const meta = {
  title: "Members/PackageFields",
  component: PackageFields,
  tags: ["autodocs"],
  decorators: [onSurface],
  args: { read: makeValueReader(idleState, { startDate: TODAY }), errors: {}, plans: planOptions },
} satisfies Meta<typeof PackageFields>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Package")).toHaveValue("");
    await expect(canvas.getByText("Choose a package and start date")).toBeVisible();
  },
};

/** Prefilled from a failed submit: plan, extra days and the end date preview. */
export const Selected: Story = {
  args: { read: makeValueReader(idleState, { planId: threeMonths.id, startDate: TODAY, extraDays: "10", amountPaid: "4500" }) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(formatDay("2027-02-16"))).toBeVisible();
    await expect(canvas.getByText(/100 days \(90 \+ 10\)/)).toBeVisible();
    await expect(canvas.getByText(formatMoney(9000))).toBeVisible();
  },
};

/** On intake the start date follows the join date until it's edited. */
export const LinkedStartDate: Story = {
  args: { prefix: "package.", read: makeValueReader(idleState, {}), linkedStart: daysFromToday(-2) },
  play: async ({ canvas, userEvent }) => {
    const start = canvas.getByLabelText("Start date");
    await expect(canvas.getByText("follows join date")).toBeVisible();
    await expect(start).toHaveValue(daysFromToday(-2));
    await expect(start).toHaveAttribute("name", "package.startDate");
    await userEvent.clear(start);
    await userEvent.type(start, TODAY);
    await expect(start).toHaveValue(TODAY);
  },
};

export const Errors: Story = {
  args: {
    errors: {
      planId: ["Choose a package."],
      startDate: ["Enter a start date."],
      extraDays: ["Extra days can't be negative."],
      amountPaid: ["The advance can't be more than the price."],
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Choose a package.")).toBeVisible();
    await expect(canvas.getByText("The advance can't be more than the price.")).toBeVisible();
  },
};

export const NoPlans: Story = {
  args: { plans: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Create one under Packages" })).toHaveAttribute("href", "/packages/new");
  },
};
