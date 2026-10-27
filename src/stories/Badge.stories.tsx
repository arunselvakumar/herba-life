import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/dashboard/recent-orders";

const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: "President's Team" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
export const Outline: Story = { args: { variant: "outline" } };
export const OrderStatuses: Story = {
  render: () => (
    <div className="flex gap-2">
      <OrderStatusBadge status="fulfilled" />
      <OrderStatusBadge status="processing" />
      <OrderStatusBadge status="on-hold" />
      <OrderStatusBadge status="cancelled" />
    </div>
  ),
};
