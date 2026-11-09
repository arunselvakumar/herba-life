import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, within } from "storybook/test";
import { SaleForm } from "@/components/stock/sale-form";
import { createSale } from "@/lib/stock/actions"; // the mock, not the server action
import { afresh, buyerOptions, kulfi, priyaId, productOptions, protein, vanilla } from "@/stories/fixtures/stock";
import { TODAY } from "@/stories/fixtures/time";

// The form's sections are cards of their own, so it sits on the page canvas.
const meta = {
  title: "Stock/SaleForm",
  component: SaleForm,
  tags: ["autodocs"],
  args: { action: createSale, products: productOptions, members: buyerOptions, today: TODAY },
} satisfies Meta<typeof SaleForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A walk-in: no member chosen, so the buyer's name field shows. */
export const Empty: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Member")).toHaveValue("");
    await expect(canvas.getByLabelText("Buyer's name")).toBeVisible();
    await expect(canvas.getByText("0 lines · ₹0")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Remove line" })).toBeDisabled();
  },
};

/** Opened from a member's profile and a product page: buyer and first line are filled in. */
export const PrefilledMember: Story = {
  args: { memberId: priyaId, productId: vanilla.id },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Member")).toHaveValue(priyaId);
    await expect(canvas.queryByLabelText("Buyer's name")).not.toBeInTheDocument();
    await expect(canvas.getByLabelText("Product")).toHaveValue(vanilla.id);
    await expect(canvas.getByLabelText("Qty")).toHaveValue(1);
    await expect(canvas.getByLabelText("Unit price")).toHaveValue(vanilla.mrp);
    await expect(canvas.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", `/members/${priyaId}`);
  },
};

/** Two lines at silver prices, part paid: the totals follow every change, then it posts. */
export const MultipleItems: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Buyer's name"), "Karthik Subramanian");
    await userEvent.selectOptions(canvas.getByLabelText("Price level"), "silver");

    const [firstProduct] = canvas.getAllByLabelText("Product");
    if (!firstProduct) throw new Error("No product line");
    await userEvent.selectOptions(firstProduct, vanilla.id);
    await userEvent.clear(canvas.getByLabelText("Qty"));
    await userEvent.type(canvas.getByLabelText("Qty"), "2");

    await userEvent.click(canvas.getByRole("button", { name: "Add line" }));
    const secondProduct = canvas.getAllByLabelText("Product")[1];
    if (!secondProduct) throw new Error("No second line");
    await userEvent.selectOptions(secondProduct, afresh.id);

    // 2 × 1,713 + 1 × 549 at silver.
    await expect(canvas.getByText("2 lines · ₹3,975")).toBeVisible();
    await userEvent.type(canvas.getByLabelText("Amount paid"), "3000");
    await expect(canvas.getByText("Balance due ₹975")).toBeVisible();
    await userEvent.selectOptions(canvas.getByLabelText("Payment mode"), "upi");
    await userEvent.click(canvas.getByRole("button", { name: "Save sale" }));

    await expect(createSale).toHaveBeenCalledTimes(1);
    const formData = mocked(createSale).mock.calls[0]?.[1];
    await expect(formData?.get("buyerName")).toBe("Karthik Subramanian");
    await expect(formData?.get("priceLevel")).toBe("silver");
    await expect(formData?.getAll("productId[]")).toEqual([vanilla.id, afresh.id]);
    await expect(formData?.getAll("quantity[]")).toEqual(["2", "1"]);
    await expect(formData?.getAll("unitPrice[]")).toEqual(["1713", "549"]);
    await expect(formData?.get("amountPaid")).toBe("3000");
    await expect(formData?.get("paymentMode")).toBe("upi");
  },
};

/** More than is on the shelf: flagged on the line before saving; out-of-stock products can't be picked. */
export const OutOfStockItem: Story = {
  args: { productId: kulfi.id },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("option", { name: new RegExp(`^${protein.stockNo} `) })).toBeDisabled();
    await userEvent.clear(canvas.getByLabelText("Qty"));
    await userEvent.type(canvas.getByLabelText("Qty"), "5");
    await expect(canvas.getByText("Only 3 on hand")).toBeVisible();
    await expect(canvas.getByLabelText("Qty")).toHaveAttribute("aria-invalid", "true");
  },
};

/** The server re-checks stock when saving and refuses the whole sale. */
export const NotEnoughStock: Story = {
  args: { memberId: priyaId, productId: kulfi.id },
  beforeEach: () => {
    mocked(createSale).mockResolvedValue({
      status: "error",
      message: "Not enough stock for this sale.",
      errors: { items: [`Only 2 × ${kulfi.name} on hand.`] },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save sale" }));
    await expect(createSale).toHaveBeenCalledTimes(1);
    // The first item error shows in the banner and under the lines.
    await expect(await canvas.findAllByText(`Only 2 × ${kulfi.name} on hand.`)).toHaveLength(2);
  },
};

export const ValidationErrors: Story = {
  beforeEach: () => {
    mocked(createSale).mockResolvedValue({
      status: "error",
      message: "Please check the sale.",
      errors: { buyerName: ["Pick a member or type the buyer's name."], "items.0.productId": ["Choose a product."] },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save sale" }));
    await expect(await canvas.findByText("Please check the sale.")).toBeVisible();
    const buyer = canvas.getByLabelText("Buyer's name").closest("div.space-y-1\\.5");
    if (!(buyer instanceof HTMLElement)) throw new Error("No buyer field");
    await expect(within(buyer).getByRole("alert")).toHaveTextContent("Pick a member or type the buyer's name.");
    await expect(canvas.getByText("Choose a product.")).toBeVisible();
  },
};
