import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";
import { BackgroundBeams } from "@/components/ui/background-beams";

// The beams fill their nearest positioned ancestor, so each story gives them
// a sized `relative` panel with content on top, the way the login page does.
// Tests run with reduced motion: the component paints one still frame and
// never starts its animation loop.
const meta = {
  title: "UI/Backgrounds/BackgroundBeams",
  component: BackgroundBeams,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="relative isolate flex h-[28rem] items-center justify-center overflow-hidden">
        <Story />
        <div className="relative z-10 max-w-sm text-center text-white">
          <p className="font-heading text-3xl font-semibold tracking-tight">Live your best life</p>
          <p className="mt-2 text-sm text-white/80">Herbalife wellness studio</p>
        </div>
      </div>
    ),
  ],
  argTypes: {
    intensity: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
    speed: { control: { type: "range", min: 0, max: 4, step: 0.25 } },
    blur: { control: { type: "range", min: 0, max: 80, step: 5 } },
  },
} satisfies Meta<typeof BackgroundBeams>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = canvasElement.querySelector("canvas");
    // Decorative: the whole layer is hidden from assistive technology.
    await expect(canvas?.parentElement).toHaveAttribute("aria-hidden", "true");
    // The ResizeObserver sizes the drawing buffer to the panel.
    const panel = canvas?.parentElement?.getBoundingClientRect().width ?? 0;
    await waitFor(() => expect(canvas?.width ?? 0).toBeGreaterThanOrEqual(Math.round(panel * 0.5)));
  },
};

export const LowIntensity: Story = {
  args: { intensity: 0.35, beams: 12, blur: 50 },
};

export const WarmHues: Story = {
  args: { hueRange: [20, 60], backgroundColor: "#1a1206" },
};
