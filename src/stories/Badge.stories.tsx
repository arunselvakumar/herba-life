import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "@/components/ui/badge";
import { PackageBadge } from "@/components/members/package-badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: "3 months" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
export const Outline: Story = { args: { variant: "outline" } };
export const PackageStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <PackageBadge state="active" />
      <PackageBadge state="expiring" />
      <PackageBadge state="upcoming" />
      <PackageBadge state="expired" />
      <PackageBadge state="completed" />
      <PackageBadge state="cancelled" />
      <PackageBadge state={null} />
    </div>
  ),
};
