import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  monthlySales,
  recentOrders,
  regionMix,
  stats,
  topDistributors,
} from "@/lib/dashboard-data";
import { StatCard } from "@/components/dashboard/stat-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { TopDistributors } from "@/components/dashboard/top-distributors";
import { RegionMix } from "@/components/dashboard/region-mix";

const meta = {
  title: "Dashboard/Widgets",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const StatCards: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.id} stat={stat} />
      ))}
    </div>
  ),
};

export const Sales: Story = {
  render: () => (
    <div className="max-w-3xl">
      <SalesChart data={monthlySales} />
    </div>
  ),
};

export const Orders: Story = {
  render: () => (
    <div className="max-w-4xl">
      <RecentOrders orders={recentOrders} />
    </div>
  ),
};

export const Distributors: Story = {
  render: () => (
    <div className="max-w-md">
      <TopDistributors distributors={topDistributors} />
    </div>
  ),
};

export const Regions: Story = {
  render: () => (
    <div className="max-w-md">
      <RegionMix regions={regionMix} />
    </div>
  ),
};
