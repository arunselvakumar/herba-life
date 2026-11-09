import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";
import { CountUp } from "@/components/motion/count-up";

// With motion allowed the figure rolls up from zero on mount; with reduced
// motion (how the tests run) it shows the final value straight away. The
// assertions wait for the final value, so they hold either way.
const meta = {
  title: "Motion/CountUp",
  component: CountUp,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { value: 1284, className: "font-heading text-5xl font-semibold tracking-tight tabular-nums" },
} satisfies Meta<typeof CountUp>;

export default meta;
type Story = StoryObj<typeof meta>;

const settles = (text: string) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await waitFor(() => expect(canvasElement).toHaveTextContent(text), { timeout: 3000 });
  };

export const Default: Story = { play: settles("1,284") };

/** Indian digit grouping: lakhs and crores. */
export const LargeNumber: Story = { args: { value: 12345678 }, play: settles("1,23,45,678") };

export const Zero: Story = { args: { value: 0 }, play: settles("0") };

export const Slow: Story = { args: { duration: 3 }, play: settles("1,284") };

/**
 * With reduced motion there is no roll-up: the final figure is there from
 * the first frame, so this checks it without waiting. (In a browser that
 * allows motion the check is skipped; the number still settles.)
 */
export const ReducedMotion: Story = {
  play: async ({ canvasElement }) => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    await expect(canvasElement).toHaveTextContent("1,284");
  },
};
