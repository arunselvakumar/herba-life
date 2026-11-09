import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { BalanceBadge, StockBadge, VoidedBadge } from "@/components/stock/stock-badge";
import { onSurface } from "@/stories/decorators";

// Stock badges sit in tables and on cards, so the stories put them on a card
// too: the contrast check measures against the real background.
const meta = {
  title: "Stock/Badges",
  component: StockBadge,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [onSurface],
  args: { state: "in_stock" },
} satisfies Meta<typeof StockBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InStock: Story = {};
export const RunningLow: Story = { args: { state: "low" } };
export const OutOfStock: Story = { args: { state: "out" } };
export const Archived: Story = { args: { state: "archived" } };

export const AllStockStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(["in_stock", "low", "out", "archived"] as const).map((state) => (
        <StockBadge key={state} state={state} />
      ))}
    </div>
  ),
};

export const Voided: Story = {
  render: () => <VoidedBadge />,
};

/** Only a positive balance shows a badge; settled and overpaid render nothing. */
export const Balance: Story = {
  render: () => (
    <dl className="grid grid-cols-[auto_auto] items-center gap-x-4 gap-y-2 text-sm">
      <dt>Owed ₹1,426</dt>
      <dd data-testid="owed">
        <BalanceBadge balance={1426} />
      </dd>
      <dt>Settled</dt>
      <dd data-testid="settled">
        <BalanceBadge balance={0} />
      </dd>
      <dt>In credit</dt>
      <dd data-testid="credit">
        <BalanceBadge balance={-200} />
      </dd>
    </dl>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("owed")).toHaveTextContent("Balance due");
    await expect(canvas.getByTestId("settled")).toBeEmptyDOMElement();
    await expect(canvas.getByTestId("credit")).toBeEmptyDOMElement();
  },
};
