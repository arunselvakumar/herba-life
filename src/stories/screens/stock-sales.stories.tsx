import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import SalesPage from "@/app/(app)/stock/sales/page";
import { listSales } from "@/lib/stock/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { balanceDueSale, saleRows, voidedSale } from "@/stories/fixtures/stock";
import { TODAY } from "@/stories/fixtures/time";
import { frontDeskUser, noRoleUser } from "@/stories/fixtures/users";

const meta = {
  title: "Screens/Stock/Sales",
  component: SalesPage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/stock/sales" } } },
  decorators: [withAppShell],
  args: { params: Promise.resolve({}), searchParams: Promise.resolve({}) },
  beforeEach: () => {
    mocked(listSales).mockResolvedValue(saleRows);
  },
} satisfies Meta<typeof SalesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const showsTheSales: Story["play"] = async ({ canvas }) => {
  await expect(await canvas.findByRole("heading", { name: "Sales" })).toBeVisible();
  await expect(await canvas.findByRole("link", { name: "Karthik Subramanian" })).toBeVisible();
  await expect(canvas.getByRole("link", { name: voidedSale.buyerName })).toBeVisible();
};

export const Desktop: Story = {
  play: async (context) => {
    await showsTheSales(context);
    const { canvas } = context;
    // Five sales, the voided one left out of the takings.
    await expect(canvas.getByText(/5 sales · ₹17,125/)).toBeVisible();
    await expect(canvas.getByRole("link", { name: "New sale" })).toBeVisible();
    await expect(listSales).toHaveBeenCalledWith({ q: undefined, filter: "all", today: TODAY });
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: showsTheSales,
};

/** Front desk can sell but not export. */
export const FrontDesk: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async (context) => {
    await showsTheSales(context);
    await expect(context.canvas.queryByRole("link", { name: "Export" })).not.toBeInTheDocument();
  },
};

export const BalanceDue: Story = {
  args: { searchParams: Promise.resolve({ filter: "balance" }) },
  parameters: { nextjs: { navigation: { pathname: "/stock/sales", query: { filter: "balance" } } } },
  beforeEach: () => {
    mocked(listSales).mockResolvedValue(saleRows.filter((s) => s.id === balanceDueSale.id));
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("link", { name: balanceDueSale.buyerName })).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Balance due" })).toHaveAttribute("aria-current", "page");
  },
};

export const Empty: Story = {
  beforeEach: () => {
    mocked(listSales).mockResolvedValue([]);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("No sales yet.")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Record a sale" })).toBeVisible();
  },
};

export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(noRoleUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(listSales).not.toHaveBeenCalled();
  },
};
