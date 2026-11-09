import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { SaleTable } from "@/components/stock/sale-table";
import { balanceDueSale, saleRows, standingSaleRows, voidedSale } from "@/stories/fixtures/stock";

// The table brings its own card, so it sits straight on the page canvas.
const meta = {
  title: "Stock/SaleTable",
  component: SaleTable,
  tags: ["autodocs"],
  args: { sales: standingSaleRows, emptyMessage: "No sales yet.", canSell: true },
} satisfies Meta<typeof SaleTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SeveralSales: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Karthik Subramanian" })).toBeVisible();
    // Shown in its own column on desktop and under the buyer on small screens.
    await expect(canvas.getAllByText("3 units · 2 products")).toHaveLength(2);
    const owing = canvas.getByRole("link", { name: balanceDueSale.buyerName }).closest("tr");
    if (!owing) throw new Error("No row for the part-paid sale");
    await expect(within(owing).getByText("Balance due")).toBeVisible();
  },
};

export const WithVoided: Story = {
  args: { sales: saleRows },
  play: async ({ canvas }) => {
    const row = canvas.getByRole("link", { name: voidedSale.buyerName }).closest("tr");
    if (!row) throw new Error("No row for the voided sale");
    await expect(within(row).getByText("Voided")).toBeVisible();
  },
};

export const Empty: Story = {
  args: { sales: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No sales yet.")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Record a sale" })).toHaveAttribute("href", "/stock/sales/new");
  },
};

/** Without `stock.sell` the empty state offers nothing to do. */
export const EmptyReadOnly: Story = {
  args: { sales: [], emptyMessage: "Nobody owes a balance.", canSell: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("link", { name: "Record a sale" })).not.toBeInTheDocument();
  },
};
