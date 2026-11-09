import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { PixelMark } from "@/components/brand/pixel-mark";
import { onInk, onSurface } from "@/stories/decorators";

// The mark paints in currentColor, so each story sets the colour around it.
// It floats and its bubbles drift when motion is allowed; tests run with
// reduced motion, where it holds still.
const meta = {
  title: "Brand/PixelMark",
  component: PixelMark,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { className: "h-24 w-auto text-brand-600" },
  decorators: [onSurface],
} satisfies Meta<typeof PixelMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Animated: Story = {
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector("svg");
    await expect(svg).toHaveAttribute("aria-hidden", "true");
    await expect(svg?.querySelectorAll('[data-px="s"]').length).toBeGreaterThan(0);
  },
};

export const Static: Story = { args: { animated: false } };

/** White on ink, as on the kiosk's welcome screen. */
export const OnInk: Story = {
  args: { className: "h-24 w-auto text-white" },
  decorators: [onInk],
};
