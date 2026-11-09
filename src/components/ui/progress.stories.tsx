import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Progress } from "@/components/ui/progress";
import { frame, onSurface } from "@/stories/decorators";

const meta = {
  title: "UI/Progress",
  component: Progress,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [frame("sm"), onSurface],
  args: { "aria-label": "Package used", value: 50 },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { name: "0 %", args: { value: 0 } };

// Note: <Progress> takes `value` for the fill but doesn't pass it on to the
// Radix root, so the bar always reports itself as indeterminate (no
// aria-valuenow). Not asserted here until progress.tsx forwards it.
export const Half: Story = { name: "50 %" };

export const Full: Story = { name: "100 %", args: { value: 100 } };

export const WithCaption: Story = {
  args: { value: 64 },
  render: (args) => (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between text-sm">
        <span id="used-label" className="font-medium">
          Package used
        </span>
        <span className="text-muted-foreground tabular-nums">58 of 90 days</span>
      </div>
      <Progress {...args} aria-label={undefined} aria-labelledby="used-label" />
    </div>
  ),
};
