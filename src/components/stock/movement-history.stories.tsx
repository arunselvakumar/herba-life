import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { MovementHistory } from "@/components/stock/movement-history";
import { vanilla, vanillaMovements } from "@/stories/fixtures/stock";

// The history brings its own card, so it sits straight on the page canvas.
const meta = {
  title: "Stock/MovementHistory",
  component: MovementHistory,
  tags: ["autodocs"],
  args: { movements: vanillaMovements, onHand: vanilla.onHand },
} satisfies Meta<typeof MovementHistory>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Deliveries, a sale, a voided sale and its reversal, and a correction. */
export const MixedMovements: Story = {
  play: async ({ canvas }) => {
    const rows = canvas.getAllByRole("row");
    // Header, then newest first: the latest delivery leaves 14 on the shelf.
    const latest = rows[1];
    if (!latest) throw new Error("No movement rows");
    await expect(within(latest).getByText("+12")).toBeVisible();
    await expect(within(latest).getByText("14")).toBeVisible();
    await expect(canvas.getByText("Returned to shelf", { exact: false })).toBeVisible();
    await expect(canvas.getByText("Tin damaged in delivery")).toBeVisible();
    await expect(canvas.getAllByRole("link", { name: "Sale #41" })).toHaveLength(2);
  },
};

export const Empty: Story = {
  args: { movements: [], onHand: 0 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Nothing yet/)).toBeVisible();
  },
};
