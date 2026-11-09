import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import ProductPage from "@/app/(app)/stock/[id]/page";
import { getProduct, listProductOptions } from "@/lib/stock/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { archivedDetail, newProductDetail, productOptions, vanillaDetail } from "@/stories/fixtures/stock";
import { frontDeskUser, noRoleUser } from "@/stories/fixtures/users";

const meta = {
  title: "Screens/Stock/ProductDetail",
  component: ProductPage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: `/stock/${vanillaDetail.id}` } } },
  decorators: [withAppShell],
  args: { params: Promise.resolve({ id: vanillaDetail.id }), searchParams: Promise.resolve({}) },
  beforeEach: () => {
    mocked(getProduct).mockResolvedValue(vanillaDetail);
    mocked(listProductOptions).mockResolvedValue(productOptions);
  },
} satisfies Meta<typeof ProductPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const showsTheProduct: Story["play"] = async ({ canvas }) => {
  await expect(await canvas.findByRole("heading", { name: vanillaDetail.name })).toBeVisible();
  await expect(canvas.getByText("Every delivery, sale and correction, newest first")).toBeVisible();
  await expect(canvas.getByText("Tin damaged in delivery")).toBeVisible();
};

/** The administrator: edit, archive, adjust, receive and sell. Never deletable: it has history. */
export const Desktop: Story = {
  play: async (context) => {
    await showsTheProduct(context);
    const { canvas } = context;
    await expect(canvas.getByRole("link", { name: "Edit" })).toHaveAttribute("href", `/stock/products/${vanillaDetail.id}/edit`);
    await expect(canvas.getByRole("button", { name: "Archive" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Adjust" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Receive stock" })).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Sell" })).toHaveAttribute("href", `/stock/sales/new?product=${vanillaDetail.id}`);
    await expect(canvas.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: showsTheProduct,
};

/** Front desk can see the product and sell it, nothing more. */
export const FrontDesk: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async (context) => {
    await showsTheProduct(context);
    const { canvas } = context;
    await expect(canvas.getByRole("link", { name: "Sell" })).toBeVisible();
    await expect(canvas.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Adjust" })).not.toBeInTheDocument();
    await expect(listProductOptions).not.toHaveBeenCalled();
  },
};

/** Archived: can only be restored; nothing to receive, adjust or sell. */
export const Archived: Story = {
  args: { params: Promise.resolve({ id: archivedDetail.id }) },
  parameters: { nextjs: { navigation: { pathname: `/stock/${archivedDetail.id}` } } },
  beforeEach: () => {
    mocked(getProduct).mockResolvedValue(archivedDetail);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { name: archivedDetail.name })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Restore" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Adjust" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("link", { name: "Sell" })).not.toBeInTheDocument();
  },
};

/** Never stocked or sold: it can be deleted, and the history is empty. */
export const NeverStocked: Story = {
  args: { params: Promise.resolve({ id: newProductDetail.id }) },
  parameters: { nextjs: { navigation: { pathname: `/stock/${newProductDetail.id}` } } },
  beforeEach: () => {
    mocked(getProduct).mockResolvedValue(newProductDetail);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { name: newProductDetail.name })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Delete" })).toBeVisible();
    await expect(canvas.getByText(/Nothing yet. Receive a delivery/)).toBeVisible();
    // Nothing on the shelf, so nothing to sell.
    await expect(canvas.queryByRole("link", { name: "Sell" })).not.toBeInTheDocument();
  },
};

export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(noRoleUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(getProduct).not.toHaveBeenCalled();
  },
};
