import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import EditProductPage from "@/app/(app)/stock/products/[id]/edit/page";
import { getProduct, listCategories } from "@/lib/stock/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { categories, vanillaDetail } from "@/stories/fixtures/stock";
import { frontDeskUser } from "@/stories/fixtures/users";

const meta = {
  title: "Screens/Stock/EditProduct",
  component: EditProductPage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: `/stock/products/${vanillaDetail.id}/edit` } } },
  decorators: [withAppShell],
  args: { params: Promise.resolve({ id: vanillaDetail.id }), searchParams: Promise.resolve({}) },
  beforeEach: () => {
    mocked(getProduct).mockResolvedValue(vanillaDetail);
    mocked(listCategories).mockResolvedValue(categories);
  },
} satisfies Meta<typeof EditProductPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const showsTheProduct: Story["play"] = async ({ canvas }) => {
  await expect(await canvas.findByRole("heading", { name: `Edit ${vanillaDetail.name}` })).toBeVisible();
  await expect(canvas.getByLabelText("Stock number")).toHaveValue(vanillaDetail.stockNo);
  await expect(canvas.getByLabelText("Gold")).toHaveValue(vanillaDetail.goldPrice);
  await expect(canvas.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", `/stock/${vanillaDetail.id}`);
};

export const Desktop: Story = { play: showsTheProduct };

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: showsTheProduct,
};

/** Front desk lacks `stock.products`. */
export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
  },
};
