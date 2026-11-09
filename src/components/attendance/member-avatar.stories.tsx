import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MemberAvatar } from "@/components/attendance/member-avatar";
import { onSurface } from "@/stories/decorators";

const meta = {
  title: "Attendance/MemberAvatar",
  component: MemberAvatar,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [onSurface],
  args: { member: { firstName: "Priya", lastName: "Sharma" } },
} satisfies Meta<typeof MemberAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {};
export const LongName: Story = { args: { member: { firstName: "Venkatalakshmi", lastName: "Ramachandran Subramaniam" } } };
export const FirstNameOnly: Story = { args: { member: { firstName: "Faizal", lastName: "" } } };
/** The day log's compact size. */
export const InTable: Story = { args: { className: "size-8 text-xs" } };
/** The kiosk's confirmation dialog. */
export const Kiosk: Story = { args: { className: "size-20 text-2xl" } };
