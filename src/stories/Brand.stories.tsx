import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Logo, LogoMark } from "@/components/brand/logo";

const meta = {
  title: "Brand/Logo",
  component: Logo,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnLinen: Story = {
  args: { className: "text-brand-600", subtitle: "Internal" },
};

export const OnEvergreen: Story = {
  args: {
    className: "text-white",
    markClassName: "text-brand-200",
    subtitle: "Internal",
  },
  globals: { backgrounds: { value: "evergreen" } },
};

export const MarkOnly: Story = {
  render: () => <LogoMark className="size-16 text-brand-600" />,
};
