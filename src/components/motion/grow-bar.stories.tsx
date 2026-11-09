import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { GrowBar } from "@/components/motion/grow-bar";
import { frame, onSurface } from "@/stories/decorators";

// GrowBar is a progressbar, so it needs a name: StatCard passes its progress
// label, and so does every story here.
const meta = {
  title: "Motion/GrowBar",
  component: GrowBar,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [frame("sm"), onSurface],
  args: { value: 0.64, label: "Package used" },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    tone: { control: "radio", options: ["ink", "leaf"] },
  },
} satisfies Meta<typeof GrowBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ink: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("progressbar", { name: "Package used" })).toHaveAttribute("aria-valuenow", "64");
  },
};

export const Leaf: Story = { args: { tone: "leaf", value: 0.82, label: "Monthly visit target" } };

export const WithLabel: Story = {
  args: { tone: "leaf", value: 0.4, label: "Stock left" },
  render: (args) => (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{args.label}</span>
        <span className="text-muted-foreground tabular-nums">{Math.round(args.value * 100)} %</span>
      </div>
      <GrowBar {...args} />
    </div>
  ),
};

/** Bad data never overflows the track: values clamp to 0–100 %. */
export const Clamped: Story = {
  args: { value: 1.7 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  },
};

export const Empty: Story = { args: { value: 0 } };
