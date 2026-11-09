import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import { MemberPurchases } from "@/components/stock/member-purchases";
import { listMemberSales } from "@/lib/stock/queries";
import { frame } from "@/stories/decorators";
import { memberSaleRows, priyaId } from "@/stories/fixtures/stock";

// An async server component: it reads `listMemberSales`, which each story mocks.
const meta = {
  title: "Stock/MemberPurchases",
  component: MemberPurchases,
  tags: ["autodocs"],
  decorators: [frame("sm")],
  args: { memberId: priyaId, canSell: true },
  beforeEach: () => {
    mocked(listMemberSales).mockResolvedValue(memberSaleRows);
  },
} satisfies Meta<typeof MemberPurchases>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One paid, one part paid, one voided: the voided one doesn't count towards the balance. */
export const WithPurchases: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Balance due ₹1,179")).toBeVisible();
    await expect(canvas.getByText("Voided")).toBeVisible();
    await expect(canvas.getByRole("link", { name: /Sell products/ })).toHaveAttribute("href", `/stock/sales/new?member=${priyaId}`);
    await expect(listMemberSales).toHaveBeenCalledWith(priyaId);
  },
};

export const None: Story = {
  beforeEach: () => {
    mocked(listMemberSales).mockResolvedValue([]);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/Nothing bought yet. Record a sale/)).toBeVisible();
  },
};

/** Without `stock.sell`: no "Sell products" button and a plainer empty line. */
export const CantSell: Story = {
  args: { canSell: false },
  beforeEach: () => {
    mocked(listMemberSales).mockResolvedValue([]);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Nothing bought yet.")).toBeVisible();
    await expect(canvas.queryByRole("link", { name: /Sell products/ })).not.toBeInTheDocument();
  },
};
