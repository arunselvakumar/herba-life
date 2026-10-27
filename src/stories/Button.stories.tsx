import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: "Export report" },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "secondary", "ghost", "destructive", "link"],
    },
    size: { control: "select", options: ["xs", "sm", "default", "lg"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Outline: Story = { args: { variant: "outline" } };
export const Secondary: Story = { args: { variant: "secondary" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Destructive: Story = { args: { variant: "destructive", children: "Cancel order" } };
export const WithIcon: Story = {
  args: { size: "lg" },
  render: (args) => (
    <Button {...args}>
      <DownloadIcon data-icon="inline-start" />
      Export report
    </Button>
  ),
};
export const Loading: Story = { args: { disabled: true, children: "Signing in…" } };
