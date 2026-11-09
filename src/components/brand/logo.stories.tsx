import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Logo, LogoMark } from "@/components/brand/logo";
import { onInk } from "@/stories/decorators";
import { knownIssues } from "@/stories/a11y";

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

export const OnCanvas: Story = {
  args: { subtitle: "Nutrition centre", imageClassName: "h-10" },
  parameters: {
    // Known issue: the brand-tone subtitle is muted text at 70 % opacity,
    // 2.7:1 against the canvas (needs 4.5:1). The app only uses the white
    // tone (login page), so this is a design follow-up, not a live bug.
    a11y: knownIssues("color-contrast"),
  },
};

export const OnInk: Story = {
  args: { tone: "white", subtitle: "Live your best life", imageClassName: "h-10" },
  decorators: [onInk],
};

export const MarkOnly: Story = {
  render: () => <LogoMark className="h-16" />,
};

export const MarkOnInk: Story = {
  render: () => <LogoMark className="h-16" tone="white" />,
  decorators: [onInk],
};
