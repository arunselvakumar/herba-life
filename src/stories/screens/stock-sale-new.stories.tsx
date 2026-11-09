import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import NewSalePage from "@/app/(app)/stock/sales/new/page";
import { createSale } from "@/lib/stock/actions";
import { listBuyerOptions, listProductOptions } from "@/lib/stock/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { afresh, buyerOptions, priyaId, productOptions } from "@/stories/fixtures/stock";
import { noRoleUser } from "@/stories/fixtures/users";

const meta = {
  title: "Screens/Stock/NewSale",
  component: NewSalePage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/stock/sales/new" } } },
  decorators: [withAppShell],
  args: { params: Promise.resolve({}), searchParams: Promise.resolve({}) },
  beforeEach: () => {
    mocked(listProductOptions).mockResolvedValue(productOptions);
    mocked(listBuyerOptions).mockResolvedValue(buyerOptions);
  },
} satisfies Meta<typeof NewSalePage>;

export default meta;
type Story = StoryObj<typeof meta>;

const showsTheForm: Story["play"] = async ({ canvas }) => {
  await expect(await canvas.findByRole("heading", { name: "New sale" })).toBeVisible();
  await expect(canvas.getByLabelText("Member")).toBeVisible();
  await expect(canvas.getByRole("button", { name: "Save sale" })).toBeVisible();
};

/** A walk-in buying one product. */
export const Desktop: Story = {
  play: async (context) => {
    await showsTheForm(context);
    const { canvas, userEvent } = context;
    await userEvent.type(canvas.getByLabelText("Buyer's name"), "Karthik Subramanian");
    await userEvent.selectOptions(canvas.getByLabelText("Product"), afresh.id);
    await expect(canvas.getByText("1 line · ₹699")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Save sale" }));
    await expect(mocked(createSale).mock.calls[0]?.[1].getAll("productId[]")).toEqual([afresh.id]);
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: showsTheForm,
};

/** From a member's profile: `?member=` picks the buyer. */
export const FromMember: Story = {
  args: { searchParams: Promise.resolve({ member: priyaId }) },
  parameters: { nextjs: { navigation: { pathname: "/stock/sales/new", query: { member: priyaId } } } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByLabelText("Member")).toHaveValue(priyaId);
    await expect(canvas.queryByLabelText("Buyer's name")).not.toBeInTheDocument();
  },
};

/** From a product page: `?product=` starts the first line. */
export const FromProduct: Story = {
  args: { searchParams: Promise.resolve({ product: afresh.id }) },
  parameters: { nextjs: { navigation: { pathname: "/stock/sales/new", query: { product: afresh.id } } } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByLabelText("Product")).toHaveValue(afresh.id);
    await expect(canvas.getByText("1 line · ₹699")).toBeVisible();
  },
};

export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(noRoleUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(listProductOptions).not.toHaveBeenCalled();
  },
};
