import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import NewProductPage from "@/app/(app)/stock/products/new/page";
import { createProduct } from "@/lib/stock/actions";
import { listCategories } from "@/lib/stock/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { categories } from "@/stories/fixtures/stock";
import { frontDeskUser } from "@/stories/fixtures/users";

const meta = {
  title: "Screens/Stock/NewProduct",
  component: NewProductPage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/stock/products/new" } } },
  decorators: [withAppShell],
  beforeEach: () => {
    mocked(listCategories).mockResolvedValue(categories);
  },
} satisfies Meta<typeof NewProductPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const showsTheForm: Story["play"] = async ({ canvas }) => {
  await expect(await canvas.findByRole("heading", { name: "New product" })).toBeVisible();
  await expect(canvas.getByLabelText("Reorder level")).toHaveValue(2);
  await expect(canvas.getByRole("button", { name: "Create product" })).toBeVisible();
};

export const Desktop: Story = {
  play: async (context) => {
    await showsTheForm(context);
    const { canvas, userEvent } = context;
    await userEvent.click(canvas.getByRole("button", { name: "Create product" }));
    await expect(createProduct).toHaveBeenCalledTimes(1);
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: showsTheForm,
};

/** Front desk lacks `stock.products`. */
export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(listCategories).not.toHaveBeenCalled();
  },
};
