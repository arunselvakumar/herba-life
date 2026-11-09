import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import StockPage from "@/app/(app)/stock/page";
import { listProductOptions, listStock } from "@/lib/stock/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { archivedRows, kulfi, lowStockRows, productOptions, stockRows, vanilla } from "@/stories/fixtures/stock";
import { frontDeskUser, noRoleUser } from "@/stories/fixtures/users";

const meta = {
  title: "Screens/Stock/Products",
  component: StockPage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/stock" } } },
  decorators: [withAppShell],
  args: { params: Promise.resolve({}), searchParams: Promise.resolve({}) },
  beforeEach: () => {
    mocked(listStock).mockResolvedValue(stockRows);
    mocked(listProductOptions).mockResolvedValue(productOptions);
  },
} satisfies Meta<typeof StockPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const showsTheShelf: Story["play"] = async ({ canvas }) => {
  await expect(await canvas.findByRole("heading", { name: "Stock on hand" })).toBeVisible();
  await expect(await canvas.findByRole("link", { name: vanilla.name })).toBeVisible();
  await expect(canvas.getByText(/5 products · 32 units on the shelf/)).toBeVisible();
};

/** The administrator: every action in the header. */
export const Desktop: Story = {
  play: async (context) => {
    await showsTheShelf(context);
    const { canvas } = context;
    await expect(canvas.getByRole("link", { name: "New product" })).toBeVisible();
    await expect(await canvas.findByRole("button", { name: "Receive stock" })).toBeVisible();
    await expect(canvas.getByRole("link", { name: "New sale" })).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Export" })).toBeVisible();
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: showsTheShelf,
};

/** Front desk can sell but not receive, add products or export. */
export const FrontDesk: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async (context) => {
    await showsTheShelf(context);
    const { canvas } = context;
    await expect(canvas.getByRole("link", { name: "New sale" })).toBeVisible();
    await expect(canvas.queryByRole("link", { name: "New product" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Receive stock" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("link", { name: "Export" })).not.toBeInTheDocument();
  },
};

export const RunningLow: Story = {
  args: { searchParams: Promise.resolve({ filter: "low" }) },
  parameters: { nextjs: { navigation: { pathname: "/stock", query: { filter: "low" } } } },
  beforeEach: () => {
    mocked(listStock).mockResolvedValue(lowStockRows);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("link", { name: kulfi.name })).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Running low" })).toHaveAttribute("aria-current", "page");
    await expect(listStock).toHaveBeenCalledWith({ q: undefined, filter: "low" });
  },
};

export const Archived: Story = {
  args: { searchParams: Promise.resolve({ filter: "archived" }) },
  parameters: { nextjs: { navigation: { pathname: "/stock", query: { filter: "archived" } } } },
  beforeEach: () => {
    mocked(listStock).mockResolvedValue(archivedRows);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("1 product")).toBeVisible();
  },
};

export const NoSearchResults: Story = {
  args: { searchParams: Promise.resolve({ q: "chai" }) },
  parameters: { nextjs: { navigation: { pathname: "/stock", query: { q: "chai" } } } },
  beforeEach: () => {
    mocked(listStock).mockResolvedValue([]);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("No products match that search.")).toBeVisible();
    await expect(canvas.getByRole("searchbox", { name: "Search stock" })).toHaveValue("chai");
  },
};

export const Empty: Story = {
  beforeEach: () => {
    mocked(listStock).mockResolvedValue([]);
    mocked(listProductOptions).mockResolvedValue([]);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("No products yet.")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Add a product" })).toBeVisible();
  },
};

export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(noRoleUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(listStock).not.toHaveBeenCalled();
  },
};
