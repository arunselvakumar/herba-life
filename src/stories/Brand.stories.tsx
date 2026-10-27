import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Logo, LogoMark } from "@/components/brand/logo";

const meta = {
  title: "Brand/Logo",
  component: Logo,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    tone: { control: "radio", options: ["brand", "white"] },
  },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnLinen: Story = {
  args: { subtitle: "Internal", imageClassName: "h-10" },
};

export const OnEvergreen: Story = {
  args: { tone: "white", subtitle: "Live your best life", imageClassName: "h-10" },
  globals: { backgrounds: { value: "evergreen" } },
};

export const MarkOnly: Story = {
  render: () => <LogoMark className="h-16" />,
};

export const MarkOnEvergreen: Story = {
  render: () => <LogoMark className="h-16" tone="white" />,
  globals: { backgrounds: { value: "evergreen" } },
};
