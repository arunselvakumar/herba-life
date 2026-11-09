import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { ResultBadge } from "@/components/attendance/result-badge";

// The badge is white line art; on the kiosk it sits on the result screen's
// brand green (checked in), ink (already in) or red (error).
function onResult(tone: string): Decorator {
  const OnResult: Decorator = (Story) => (
    <div className={`rounded-3xl p-10 ${tone}`}>
      <Story />
    </div>
  );
  return OnResult;
}

const meta = {
  title: "Attendance/ResultBadge",
  component: ResultBadge,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { kind: "done" },
} satisfies Meta<typeof ResultBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Done: Story = { decorators: [onResult("bg-brand-600")] };
export const AlreadyIn: Story = { args: { kind: "already" }, decorators: [onResult("bg-primary")] };
export const Problem: Story = { args: { kind: "error" }, decorators: [onResult("bg-destructive")] };
export const Small: Story = { args: { className: "size-20 md:size-20" }, decorators: [onResult("bg-brand-600")] };
