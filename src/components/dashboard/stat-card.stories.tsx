import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HourglassIcon, MessageSquareMoreIcon, PackageCheckIcon, UsersRoundIcon } from "lucide-react";
import { expect } from "storybook/test";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/stat-card";
import { frame } from "@/stories/decorators";

const meta = {
  title: "Dashboard/StatCard",
  component: StatCard,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [frame("sm")],
  args: {
    stat: { id: "checkins", label: "Follow-ups", value: 38, hint: "recorded in November 2026", icon: UsersRoundIcon },
  },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Not a link: the corner shows the module's icon. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("38")).toBeVisible();
    await expect(canvas.queryByRole("link")).toBeNull();
  },
};

/** Something needs attention: the icon sits on amber. */
export const Warning: Story = {
  args: {
    stat: { id: "inquiries", label: "Open enquiries", value: 12, hint: "2 to follow up today", icon: MessageSquareMoreIcon, tone: "warning" },
  },
};

export const Brand: Story = {
  args: {
    stat: { id: "members", label: "Members", value: 142, hint: "9 joined in November 2026", icon: UsersRoundIcon, tone: "brand" },
  },
};

/** A share drawn as a slim bar under the figure. */
export const WithProgress: Story = {
  args: {
    stat: {
      id: "active",
      label: "Active packages",
      value: 96,
      hint: "running today",
      icon: PackageCheckIcon,
      tone: "brand",
      progress: { value: 96 / 142, tone: "ink", label: "Share of members on a package" },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("progressbar", { name: "Share of members on a package" })).toHaveAttribute("aria-valuenow", "68");
  },
};

export const LeafProgress: Story = {
  args: {
    stat: {
      id: "expiring",
      label: "Ending soon",
      value: 7,
      hint: "within the next 14 days",
      icon: HourglassIcon,
      tone: "warning",
      progress: { value: 7 / 96, tone: "leaf", label: "Share of active packages ending soon" },
    },
  },
};

/** With `href` the whole card opens the module and the corner becomes an arrow. */
export const AsLink: Story = {
  args: {
    stat: { id: "members", label: "Members", value: 142, hint: "9 joined in November 2026", icon: UsersRoundIcon, href: "/members" },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Open Members" })).toHaveAttribute("href", "/members");
  },
};

/** Text values are shown as they are, without counting up. */
export const TextValue: Story = {
  args: {
    stat: { id: "revenue", label: "Revenue", value: "₹48,650", hint: "in November 2026", icon: PackageCheckIcon },
  },
};

export const Zero: Story = {
  args: {
    stat: { id: "expiring", label: "Ending soon", value: 0, hint: "within the next 14 days", icon: HourglassIcon },
  },
};

/** Holds the card's exact space while the figures load. */
export const Skeleton: Story = {
  render: () => <StatCardSkeleton />,
};
