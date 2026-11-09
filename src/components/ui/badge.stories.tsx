import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { onSurface } from "@/stories/decorators";

// Badges live on cards in the console, so the stories render on one too.

const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [onSurface],
  args: { children: "3 months" },
  argTypes: {
    variant: { control: "select", options: ["default", "secondary", "destructive", "outline", "ghost", "link"] },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
export const Destructive: Story = { args: { variant: "destructive", children: "Overdue" } };
export const Outline: Story = { args: { variant: "outline" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Link: Story = { args: { variant: "link", asChild: true, children: <a href="#plans">See plans</a> } };
export const WithIcon: Story = {
  render: (args) => (
    <Badge {...args}>
      <CheckIcon data-icon="inline-start" />
      Paid
    </Badge>
  ),
};
