import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { Label } from "@/components/ui/label";
import { ProductSelect } from "@/components/stock/product-select";
import { frame, onSurface } from "@/stories/decorators";
import { kulfi, productOptions, protein, vanilla } from "@/stories/fixtures/stock";

// In the app the picker always has a visible label from <Field>; the stories
// give it one so the select has an accessible name.
const meta = {
  title: "Stock/ProductSelect",
  component: ProductSelect,
  tags: ["autodocs"],
  decorators: [onSurface, frame("md")],
  args: { id: "product", name: "productId", products: productOptions },
  render: (args) => (
    <form className="space-y-1.5" aria-label="Pick a product">
      <Label htmlFor="product">Product</Label>
      <ProductSelect {...args} />
    </form>
  ),
} satisfies Meta<typeof ProductSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Grouped by category, each option with what is on the shelf. */
export const Default: Story = {
  play: async ({ canvas }) => {
    const select = canvas.getByLabelText("Product");
    await expect(canvas.getByRole("group", { name: "Protein" })).toBeInTheDocument();
    await expect(canvas.getByRole("option", { name: `${kulfi.stockNo} · ${kulfi.name} · 3 on hand` })).toBeInTheDocument();
    await expect(select).toHaveValue("");
  },
};

/** On a product page: pre-selected, not changeable, and the value still posts. */
export const Locked: Story = {
  args: { defaultValue: vanilla.id, locked: true },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByLabelText("Product")).toBeDisabled();
    await expect(canvas.getByLabelText("Product")).toHaveValue(vanilla.id);
    const form = canvasElement.querySelector("form");
    if (!form) throw new Error("No form");
    await expect(new FormData(form).get("productId")).toBe(vanilla.id);
  },
};

/** Required by default: the browser reports it missing until a product is picked. */
export const RequiredEmpty: Story = {
  args: { onChange: fn(), value: "" },
  play: async ({ args, canvas, userEvent }) => {
    const select = canvas.getByLabelText<HTMLSelectElement>("Product");
    await expect(select).toBeRequired();
    await expect(select.validity.valueMissing).toBe(true);
    await userEvent.selectOptions(select, vanilla.id);
    await expect(args.onChange).toHaveBeenCalledWith(vanilla.id);
  },
};

/** For sales: products with nothing on the shelf can't be chosen. */
export const OutOfStockDisabled: Story = {
  args: { disableOutOfStock: true, required: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("option", { name: new RegExp(`^${protein.stockNo} `) })).toBeDisabled();
    await expect(canvas.getByRole("option", { name: new RegExp(`^${kulfi.stockNo} `) })).toBeEnabled();
  },
};
