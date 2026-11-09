import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Separator } from "@/components/ui/separator";
import { onSurface } from "@/stories/decorators";

const meta = {
  title: "UI/Separator",
  component: Separator,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [onSurface],
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <div className="w-72 text-sm">
      <p className="font-medium">Meena Raghavan</p>
      <p className="text-muted-foreground">3-month package</p>
      <Separator {...args} className="my-4" />
      <p className="text-muted-foreground">41 visits · last on 7 Nov 2026</p>
    </div>
  ),
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <div className="flex h-5 items-center gap-4 text-sm">
      <span>Members</span>
      <Separator {...args} />
      <span>Packages</span>
      <Separator {...args} />
      <span>Stock</span>
    </div>
  ),
};
