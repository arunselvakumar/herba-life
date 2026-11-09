import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Skeleton } from "@/components/ui/skeleton";
import { frame, onSurface } from "@/stories/decorators";

// Pulses are suppressed under reduced motion (globals.css), which is how the
// tests run, so the stories render one still frame there.
const meta = {
  title: "UI/Skeleton",
  component: Skeleton,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [frame("md"), onSurface],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextLines: Story = {
  render: () => (
    <div className="grid gap-2.5">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  ),
};

export const Card: Story = {
  render: () => (
    <div className="flex items-start gap-4">
      <Skeleton className="size-12 rounded-full" />
      <div className="grid flex-1 gap-2.5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-24 w-full rounded-2xl" />
      </div>
    </div>
  ),
};

export const TableRows: Story = {
  render: () => (
    <div className="grid gap-0 divide-y divide-border/70">
      <div className="flex gap-4 pb-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="ml-auto h-3 w-12" />
      </div>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 py-3.5">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
      ))}
    </div>
  ),
};
