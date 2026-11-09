import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { PixelArt, type PixelPalette } from "@/components/brand/pixel-art";
import { onSurface } from "@/stories/decorators";

// A small heart: one row per string, one character per pixel, `.` is clear.
const heart = [
  ".RR...RR.",
  "RRRR.RRRR",
  "RRHRRRRRR",
  "RHRRRRRRR",
  ".RRRRRRR.",
  "..RRRRR..",
  "...RRR...",
  "....R....",
] as const;

const palette: PixelPalette = {
  R: { fill: "#c8102e" },
  H: { fill: "#ffffff", opacity: 0.7 },
};

const meta = {
  title: "Brand/PixelArt",
  component: PixelArt,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [onSurface],
  args: { rows: heart, palette, className: "h-24 w-auto", role: "img", "aria-label": "Heart" },
} satisfies Meta<typeof PixelArt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole("img", { name: "Heart" })).toHaveAttribute("viewBox", "0 0 9 8");
    // Transparent cells paint nothing; every other cell is one rect.
    const painted = heart.join("").replaceAll(".", "").length;
    await expect(canvasElement.querySelectorAll("rect")).toHaveLength(painted);
    await expect(canvasElement.querySelectorAll('[data-px="H"]')).toHaveLength(2);
  },
};

/** currentColor fills take the colour of the text around them. */
export const CurrentColor: Story = {
  args: {
    palette: { R: { fill: "currentColor" }, H: { fill: "currentColor", opacity: 0.4 } },
    className: "h-24 w-auto text-brand-600",
  },
};

/** The grid scales to any size and stays crisp. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-6">
      {["h-6", "h-12", "h-24"].map((height) => (
        <PixelArt key={height} {...args} aria-label={`Heart, ${height}`} className={`${height} w-auto`} />
      ))}
    </div>
  ),
};
