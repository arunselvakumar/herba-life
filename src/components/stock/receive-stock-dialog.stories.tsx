import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor, within } from "storybook/test";
import { ReceiveStockDialog } from "@/components/stock/receive-stock-dialog";
import { receiveStock } from "@/lib/stock/actions"; // the mock, not the server action
import { onSurface } from "@/stories/decorators";
import { afresh, productOptions, vanilla } from "@/stories/fixtures/stock";
import { TODAY } from "@/stories/fixtures/time";

const meta = {
  title: "Stock/ReceiveStockDialog",
  component: ReceiveStockDialog,
  tags: ["autodocs"],
  decorators: [onSurface],
  args: { products: productOptions, today: TODAY },
} satisfies Meta<typeof ReceiveStockDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

/** From the stock list: pick the product, save, and the dialog stays open for the next line. */
export const PickAProduct: Story = {
  beforeEach: () => {
    mocked(receiveStock).mockResolvedValue({ status: "success", message: `Added 6 × ${afresh.name} to stock.` });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Receive stock" }));
    // Dialogs render in a portal: query the whole document.
    const dialog = await within(document.body).findByRole("dialog", { name: "Receive stock" });
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.selectOptions(within(dialog).getByLabelText("Product"), afresh.id);
    await userEvent.type(within(dialog).getByLabelText("Quantity"), "6");
    await userEvent.type(within(dialog).getByLabelText("Unit cost"), "480");
    await userEvent.type(within(dialog).getByLabelText("Note"), "Invoice HL-2304");
    await userEvent.click(within(dialog).getByRole("button", { name: "Add to stock" }));

    await expect(await within(dialog).findByText(`Added 6 × ${afresh.name} to stock.`)).toBeVisible();
    const formData = mocked(receiveStock).mock.calls[0]?.[1];
    await expect(formData?.get("productId")).toBe(afresh.id);
    await expect(formData?.get("quantity")).toBe("6");
    await expect(formData?.get("unitCost")).toBe("480");
    await expect(formData?.get("movedOn")).toBe(TODAY);
    // Ready for the next line: the quantity clears and Cancel becomes Done.
    await expect(within(dialog).getByLabelText("Quantity")).toHaveValue(null);
    await expect(within(dialog).getByRole("button", { name: "Done" })).toBeVisible();
  },
};

/** From a product page: the product is fixed, and still posts. */
export const ProductFixed: Story = {
  args: { productId: vanilla.id },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Receive stock" }));
    const dialog = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(within(dialog).getByLabelText("Product")).toBeDisabled();
    await expect(within(dialog).getByLabelText("Product")).toHaveValue(vanilla.id);
    await userEvent.type(within(dialog).getByLabelText("Quantity"), "12");
    await userEvent.click(within(dialog).getByRole("button", { name: "Add to stock" }));
    await expect(mocked(receiveStock).mock.calls[0]?.[1].get("productId")).toBe(vanilla.id);
  },
};

export const ValidationErrors: Story = {
  beforeEach: () => {
    mocked(receiveStock).mockResolvedValue({
      status: "error",
      errors: { productId: ["Choose a product."], quantity: ["Enter how many units arrived."] },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Receive stock" }));
    const dialog = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.click(within(dialog).getByRole("button", { name: "Add to stock" }));
    await expect(await within(dialog).findByText("Choose a product.")).toBeVisible();
    await expect(within(dialog).getByText("Enter how many units arrived.")).toBeVisible();
  },
};
