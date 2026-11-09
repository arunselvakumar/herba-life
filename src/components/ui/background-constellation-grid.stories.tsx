import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";
import { BackgroundConstellationGrid } from "@/components/ui/background-constellation-grid";

// The grid fills its nearest positioned ancestor, so each story gives it a
// sized `relative` panel with a card on top, the way the console layout does.
// Move the pointer over bare canvas to push the mesh; the card blocks it.
const meta = {
  title: "UI/Backgrounds/ConstellationGrid",
  component: BackgroundConstellationGrid,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="relative isolate flex h-[28rem] items-center justify-center overflow-hidden">
        <Story />
        <div className="surface relative z-10 max-w-xs p-6 text-sm">
          <p className="font-semibold">Overview</p>
          <p className="mt-1 text-muted-foreground">The pointer leaves the mesh alone over cards like this one.</p>
        </div>
      </div>
    ),
  ],
  argTypes: {
    spacing: { control: { type: "range", min: 16, max: 120, step: 4 } },
    force: { control: { type: "range", min: 0, max: 3, step: 0.25 } },
    dotOpacity: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    lineOpacity: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
  },
} satisfies Meta<typeof BackgroundConstellationGrid>;

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

export const Dense: Story = {
  args: { spacing: 28, dotOpacity: 0.3, lineOpacity: 0.1, radius: 120 },
};

/**
 * What a visitor with reduced motion gets: the dots never move (the push is
 * zero), but the green highlight still follows the pointer. `force: 0` gives
 * the same result with motion allowed, so the story shows it in any browser.
 * The tests already run with `prefers-reduced-motion: reduce`.
 */
export const ReducedMotion: Story = {
  args: { force: 0 },
};
