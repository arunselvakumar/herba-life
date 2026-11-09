import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRightIcon, DownloadIcon, Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { expect, fn } from "storybook/test";
import { Button } from "@/components/ui/button";

const variants = ["default", "outline", "secondary", "ghost", "destructive", "link"] as const;
const sizes = ["xs", "sm", "default", "lg"] as const;
const iconSizes = ["icon-xs", "icon-sm", "icon", "icon-lg"] as const;

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: "Export report", onClick: fn() },
  argTypes: {
    variant: { control: "select", options: variants },
    size: { control: "select", options: [...sizes, ...iconSizes] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Export report" }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
export const Outline: Story = { args: { variant: "outline" } };
export const Secondary: Story = { args: { variant: "secondary" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Destructive: Story = { args: { variant: "destructive", children: "Cancel order" } };
export const Link: Story = { args: { variant: "link", children: "View all members" } };

export const EveryVariant: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {variants.map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

export const EverySize: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {sizes.map((size) => (
        <Button key={size} {...args} size={size}>
          <PlusIcon data-icon="inline-start" />
          Size {size}
        </Button>
      ))}
    </div>
  ),
};

export const IconOnly: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {iconSizes.map((size) => (
        <Button key={size} {...args} size={size} variant="outline" aria-label={`Delete (${size})`}>
          <Trash2Icon />
        </Button>
      ))}
    </div>
  ),
};

export const WithIcon: Story = {
  args: { size: "lg" },
  render: (args) => (
    <Button {...args}>
      <DownloadIcon data-icon="inline-start" />
      Export report
    </Button>
  ),
};

export const WithTrailingIcon: Story = {
  args: { variant: "outline" },
  render: (args) => (
    <Button {...args}>
      Next
      <ArrowRightIcon data-icon="inline-end" />
    </Button>
  ),
};

export const AsLink: Story = {
  args: { asChild: true, variant: "outline", children: <a href="#members">Open members</a> },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas }) => {
    await expect(canvas.getByRole("button", { name: "Export report" })).toBeDisabled();
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Loading: Story = {
  args: { disabled: true, children: "Signing in…" },
  render: (args) => (
    <Button {...args}>
      <Loader2Icon data-icon="inline-start" className="animate-spin" aria-hidden />
      {args.children}
    </Button>
  ),
};
