import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { GhostTitle } from "@/components/motion/ghost-title";

// The watermark is absolutely positioned behind a page heading, so the story
// renders it inside a `relative` header the way PageHeader does.
const meta = {
  title: "Motion/GhostTitle",
  component: GhostTitle,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: { text: "Members" },
  render: (args) => (
    <header className="relative isolate overflow-hidden py-10">
      <GhostTitle {...args} />
      <h1 className="relative z-10 font-heading text-3xl font-semibold tracking-[-0.03em] md:text-[2.5rem] md:leading-[1.1]">
        {args.text}
      </h1>
      <p className="relative z-10 mt-2 text-sm text-muted-foreground">128 active, 14 ending this month</p>
    </header>
  ),
} satisfies Meta<typeof GhostTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    // Decorative: only the real heading is announced.
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("Members");
    await expect(canvas.getAllByText("Members")[0]).toHaveAttribute("aria-hidden", "true");
  },
};

export const LongTitle: Story = { args: { text: "Attendance and check-ins" } };
