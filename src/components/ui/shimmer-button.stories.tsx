import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SparklesIcon } from "lucide-react";
import { expect, fn } from "storybook/test";
import { ShimmerButton } from "@/components/ui/shimmer-button";

// Tests run with reduced motion, which hides the spark: they check the
// button renders and works, not the animation. Browse the story to see it.
const meta = {
  title: "UI/ShimmerButton",
  component: ShimmerButton,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: "Start check-in", onClick: fn() },
  argTypes: {
    variant: { control: "select", options: ["default", "outline", "secondary", "ghost", "destructive"] },
    size: { control: "select", options: ["xs", "sm", "default", "lg"] },
  },
} satisfies Meta<typeof ShimmerButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Start check-in" }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const CustomShimmer: Story = {
  args: { size: "lg", shimmerColor: "#b5e3bd", shimmerSize: "0.15em", shimmerDuration: "2s" },
  render: (args) => (
    <ShimmerButton {...args}>
      <SparklesIcon data-icon="inline-start" />
      {args.children}
    </ShimmerButton>
  ),
};

export const Outline: Story = {
  args: { variant: "outline", shimmerColor: "#42a046" },
};
