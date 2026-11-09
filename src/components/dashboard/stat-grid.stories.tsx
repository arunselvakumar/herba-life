import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  BoxesIcon,
  CalendarCheckIcon,
  ClipboardListIcon,
  HourglassIcon,
  MessageSquareMoreIcon,
  PackageCheckIcon,
  ShoppingBagIcon,
  UsersRoundIcon,
} from "lucide-react";
import { expect } from "storybook/test";
import { StatCard, StatCardSkeleton, type Stat } from "@/components/dashboard/stat-card";
import { StatGrid } from "@/components/dashboard/stat-grid";

/** The dashboard's eight figures, as the page builds them from the fixtures. */
const stats: Stat[] = [
  { id: "members", label: "Members", value: 142, hint: "9 joined in November 2026", icon: UsersRoundIcon, tone: "brand", href: "/members" },
  {
    id: "active",
    label: "Active packages",
    value: 96,
    hint: "running today",
    icon: PackageCheckIcon,
    tone: "brand",
    href: "/members?filter=active",
    progress: { value: 96 / 142, tone: "ink", label: "Share of members on a package" },
  },
  {
    id: "expiring",
    label: "Ending soon",
    value: 7,
    hint: "within the next 14 days",
    icon: HourglassIcon,
    tone: "warning",
    href: "/members?filter=expiring",
    progress: { value: 7 / 96, tone: "leaf", label: "Share of active packages ending soon" },
  },
  { id: "checkins", label: "Follow-ups", value: 38, hint: "recorded in November 2026", icon: ClipboardListIcon, href: "/members?filter=due" },
  { id: "inquiries", label: "Open enquiries", value: 12, hint: "2 to follow up today", icon: MessageSquareMoreIcon, tone: "warning", href: "/inquiries" },
  { id: "attendance", label: "Check-ins today", value: 23, hint: "21 members came in", icon: CalendarCheckIcon, tone: "brand", href: "/attendance" },
  { id: "stock-low", label: "Running low", value: 4, hint: "1 out of stock · 3 nearly", icon: BoxesIcon, tone: "warning", href: "/stock?filter=low" },
  { id: "sales", label: "Product sales", value: 27, hint: "₹48,650 in November 2026", icon: ShoppingBagIcon, tone: "brand", href: "/stock/sales?filter=month" },
];

const meta = {
  title: "Dashboard/StatGrid",
  component: StatGrid,
  parameters: { layout: "padded" },
  globals: { viewport: { value: "desktop" } },
  args: { "aria-label": "Key metrics", className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4" },
} satisfies Meta<typeof StatGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullGrid: Story = {
  render: (args) => (
    <StatGrid {...args}>
      {stats.map((stat) => (
        <StatCard key={stat.id} stat={stat} />
      ))}
    </StatGrid>
  ),
  play: async ({ canvas }) => {
    const region = canvas.getByRole("region", { name: "Key metrics" });
    await expect(region).toBeVisible();
    await expect(canvas.getAllByRole("link", { name: /^Open / })).toHaveLength(8);
  },
};

/** A role without the module permissions: the same figures, no links. */
export const ReadOnly: Story = {
  render: (args) => (
    <StatGrid {...args}>
      {stats.map(({ href: _href, ...stat }) => (
        <StatCard key={stat.id} stat={stat} />
      ))}
    </StatGrid>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.queryAllByRole("link")).toHaveLength(0);
  },
};

export const Loading: Story = {
  render: (args) => (
    <StatGrid {...args}>
      {stats.map((stat) => (
        <StatCardSkeleton key={stat.id} />
      ))}
    </StatGrid>
  ),
};
