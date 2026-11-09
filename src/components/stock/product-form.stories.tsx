import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import { ProductForm } from "@/components/stock/product-form";
import { createProduct, updateProduct } from "@/lib/stock/actions"; // the mocks, not the server actions
import { aloe, categories } from "@/stories/fixtures/stock";

// The form's sections are cards of their own, so it sits on the page canvas.
const meta = {
  title: "Stock/ProductForm",
  component: ProductForm,
  tags: ["autodocs"],
  args: {
    action: createProduct,
    defaults: { reorderLevel: "2" },
    categories,
    submitLabel: "Create product",
    cancelHref: "/stock",
  },
} satisfies Meta<typeof ProductForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Stock number"), "4466");
    await userEvent.type(canvas.getByLabelText("Name"), "Herbal Tea Concentrate – Cinnamon – 51 gms");
    await userEvent.type(canvas.getByLabelText("Category"), "Energy and fitness");
    await userEvent.type(canvas.getByLabelText("MRP"), "1799");
    await userEvent.click(canvas.getByRole("button", { name: "Create product" }));

    await expect(createProduct).toHaveBeenCalledTimes(1);
    const formData = mocked(createProduct).mock.calls[0]?.[1];
    await expect(formData?.get("stockNo")).toBe("4466");
    await expect(formData?.get("reorderLevel")).toBe("2");
    await expect(formData?.get("mrp")).toBe("1799");
  },
};

const text = (value: number | null) => (value === null ? "" : String(value));

/** No preferred prices or volume points on this one: those fields start empty. */
export const Edit: Story = {
  args: {
    action: updateProduct.bind(null, aloe.id),
    defaults: {
      stockNo: aloe.stockNo,
      name: aloe.name,
      category: aloe.category,
      volumePoints: text(aloe.volumePoints),
      mrp: text(aloe.mrp),
      bronzePrice: text(aloe.bronzePrice),
      silverPrice: text(aloe.silverPrice),
      goldPrice: text(aloe.goldPrice),
      reorderLevel: String(aloe.reorderLevel),
      sortOrder: String(aloe.sortOrder),
    },
    submitLabel: "Save changes",
    cancelHref: `/stock/${aloe.id}`,
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByLabelText("Name")).toHaveValue(aloe.name);
    await expect(canvas.getByLabelText("Bronze")).toHaveValue(null);
    await userEvent.clear(canvas.getByLabelText("MRP"));
    await userEvent.type(canvas.getByLabelText("MRP"), "2499");
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));

    const [productId, , formData] = mocked(updateProduct).mock.calls[0] ?? [];
    await expect(productId).toBe(aloe.id);
    await expect(formData?.get("mrp")).toBe("2499");
    await expect(canvas.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", `/stock/${aloe.id}`);
  },
};

export const Errors: Story = {
  beforeEach: () => {
    mocked(createProduct).mockResolvedValue({
      status: "error",
      message: "Please check the form.",
      errors: {
        stockNo: ["Stock number 0141 is already used by Formula 1 Nutritional Shake Mix – Vanilla – 500 gms."],
        mrp: ["Enter the MRP."],
        goldPrice: ["Must be 0 or more."],
      },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Stock number"), "0141");
    await userEvent.type(canvas.getByLabelText("Name"), "Formula 1 – Vanilla");
    await userEvent.type(canvas.getByLabelText("Gold"), "-5");
    await userEvent.click(canvas.getByRole("button", { name: "Create product" }));

    await expect(await canvas.findByText("Please check the form.")).toBeVisible();
    await expect(canvas.getByText(/is already used by/)).toBeVisible();
    await expect(canvas.getByText("Enter the MRP.")).toBeVisible();
    await expect(canvas.getByText("Must be 0 or more.")).toBeVisible();
    // What was typed survives the failed submit.
    await expect(canvas.getByLabelText("Stock number")).toHaveValue("0141");
    await expect(canvas.getByLabelText("Name")).toHaveValue("Formula 1 – Vanilla");
  },
};
