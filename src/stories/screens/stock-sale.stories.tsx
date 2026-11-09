import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, within } from "storybook/test";
import SalePage from "@/app/(app)/stock/sales/[id]/page";
import { voidSale } from "@/lib/stock/actions";
import { getSale } from "@/lib/stock/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { balanceDueSale, saleToday, voidedSale, walkInSale } from "@/stories/fixtures/stock";
import { frontDeskUser, noRoleUser } from "@/stories/fixtures/users";

const meta = {
  title: "Screens/Stock/SaleDetail",
  component: SalePage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: `/stock/sales/${saleToday.id}` } } },
  decorators: [withAppShell],
  args: { params: Promise.resolve({ id: saleToday.id }), searchParams: Promise.resolve({}) },
  beforeEach: () => {
    mocked(getSale).mockResolvedValue(saleToday);
  },
} satisfies Meta<typeof SalePage>;

export default meta;
type Story = StoryObj<typeof meta>;

const showsTheReceipt: Story["play"] = async ({ canvas }) => {
  await expect(await canvas.findByRole("heading", { name: "Sale #44" })).toBeVisible();
  await expect(canvas.getByRole("link", { name: "Priya Sharma" })).toBeVisible();
  await expect(canvas.getByText("₹5,057 · UPI")).toBeVisible();
  await expect(canvas.getByText(saleToday.notes ?? "")).toBeVisible();
};

/** A member's sale, paid in full: the administrator can void it from here. */
export const Desktop: Story = {
  play: async (context) => {
    await showsTheReceipt(context);
    const { canvas, userEvent } = context;
    await userEvent.click(canvas.getByRole("button", { name: "Void sale" }));
    const dialog = await within(document.body).findByRole("dialog", { name: "Void sale #44?" });
    await userEvent.type(within(dialog).getByLabelText("Reason"), "Customer returned it unopened");
    await userEvent.click(within(dialog).getByRole("button", { name: "Void sale" }));
    await expect(await within(dialog).findByText("Saved.")).toBeVisible();
    await expect(mocked(voidSale).mock.calls[0]?.[0]).toBe(saleToday.id);
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: showsTheReceipt,
};

export const Voided: Story = {
  args: { params: Promise.resolve({ id: voidedSale.id }) },
  parameters: { nextjs: { navigation: { pathname: `/stock/sales/${voidedSale.id}` } } },
  beforeEach: () => {
    mocked(getSale).mockResolvedValue(voidedSale);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { name: "Sale #41" })).toBeVisible();
    await expect(canvas.getByText(/Voided .* by Arun Selva Kumar/)).toBeVisible();
    await expect(canvas.getByText("Entered twice. Every unit went back on the shelf.")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Void sale" })).not.toBeInTheDocument();
  },
};

export const BalanceDue: Story = {
  args: { params: Promise.resolve({ id: balanceDueSale.id }) },
  parameters: { nextjs: { navigation: { pathname: `/stock/sales/${balanceDueSale.id}` } } },
  beforeEach: () => {
    mocked(getSale).mockResolvedValue(balanceDueSale);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { name: "Sale #42" })).toBeVisible();
    await expect(canvas.getByText(/Silver prices/)).toBeVisible();
    await expect(canvas.getByText("₹1,426")).toBeVisible();
  },
};

/** A walk-in, seen by front desk: no void button (that needs `stock.adjust`). */
export const WalkInFrontDesk: Story = {
  args: { params: Promise.resolve({ id: walkInSale.id }) },
  parameters: { nextjs: { navigation: { pathname: `/stock/sales/${walkInSale.id}` } } },
  beforeEach: () => {
    mocked(getSale).mockResolvedValue(walkInSale);
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { name: "Sale #43" })).toBeVisible();
    await expect(canvas.getByText("Walk-in")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Void sale" })).not.toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: "New sale" })).toHaveAttribute("href", "/stock/sales/new");
  },
};

export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(noRoleUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(getSale).not.toHaveBeenCalled();
  },
};
