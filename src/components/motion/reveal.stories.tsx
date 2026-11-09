import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";
import { Reveal } from "@/components/motion/reveal";
import { frame } from "@/stories/decorators";

// With motion allowed, blocks fade and lift in one after another on mount.
// With reduced motion (how the tests run) they appear at once. Either way
// every block ends visible and marked `data-revealed`.
const meta = {
  title: "Motion/Reveal",
  component: Reveal,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [frame("md")],
} satisfies Meta<typeof Reveal>;

export default meta;
type Story = StoryObj<typeof meta>;

const stats = [
  { label: "Active members", value: "128" },
  { label: "Visits today", value: "38" },
  { label: "Packages ending this week", value: "4" },
  { label: "Open inquiries", value: "11" },
] as const;

export const Single: Story = {
  render: (args) => (
    <Reveal {...args} className="surface p-6">
      <p className="font-semibold">Welcome back, Meena</p>
      <p className="mt-1 text-sm text-muted-foreground">Here&apos;s how the studio is doing today.</p>
    </Reveal>
  ),
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByText("Welcome back, Meena")).toBeVisible());
  },
};

export const StaggeredList: Story = {
  args: { stagger: 0.12 },
  render: (args) => (
    <Reveal {...args} className="grid gap-3 sm:grid-cols-2">
      {stats.map((stat) => (
        <div key={stat.label} data-reveal className="surface p-5">
          <p className="text-eyebrow">{stat.label}</p>
          <p className="mt-1 font-heading text-3xl font-semibold tabular-nums">{stat.value}</p>
        </div>
      ))}
    </Reveal>
  ),
  play: async ({ canvasElement }) => {
    const blocks = Array.from(canvasElement.querySelectorAll("[data-reveal]"));
    await expect(blocks).toHaveLength(4);
    await waitFor(
      () => {
        for (const block of blocks) {
          expect(block).toHaveAttribute("data-revealed");
          expect(block).toBeVisible();
        }
      },
      { timeout: 3000 },
    );
  },
};
