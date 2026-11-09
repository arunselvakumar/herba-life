import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { StockTable } from "@/components/stock/stock-table";
import { archivedRows, kulfi, lowStockRows, protein, stockRows } from "@/stories/fixtures/stock";

// The table brings its own card, so it sits straight on the page canvas.
const meta = {
  title: "Stock/StockTable",
  component: StockTable,
  tags: ["autodocs"],
  args: { products: stockRows, emptyMessage: "No products yet.", canManage: true },
} satisfies Meta<typeof StockTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every active product, grouped by category, one in each shelf state. */
export const InStock: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Weight management")).toBeVisible();
    await expect(canvas.getByRole("link", { name: kulfi.name })).toHaveAttribute("href", `/stock/${kulfi.id}`);
    await expect(canvas.getByText("Running low")).toBeVisible();
    await expect(canvas.getByText("Out of stock")).toBeVisible();
  },
};

export const LowAndOut: Story = {
  args: { products: lowStockRows },
  play: async ({ canvas }) => {
    const row = canvas.getByRole("link", { name: protein.name }).closest("tr");
    if (!row) throw new Error("No row for the out-of-stock product");
    await expect(within(row).getByText("0")).toBeVisible();
    await expect(within(row).getByText("Out of stock")).toBeVisible();
  },
};

export const ArchivedProducts: Story = {
  args: { products: archivedRows },
};

/** Without `stock.products` the empty state has no "Add a product" link. */
export const ReadOnly: Story = {
  args: { products: [], emptyMessage: "Nothing is running low.", canManage: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Nothing is running low.")).toBeVisible();
    await expect(canvas.queryByRole("link", { name: "Add a product" })).not.toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: { products: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No products yet.")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Add a product" })).toHaveAttribute("href", "/stock/products/new");
  },
};
