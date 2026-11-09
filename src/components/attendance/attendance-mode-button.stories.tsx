import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { AttendanceModeButton } from "@/components/attendance/attendance-mode-button";
import { hardNavigate } from "@/lib/hard-navigate";
import { onSurface } from "@/stories/decorators";

const meta = {
  title: "Attendance/AttendanceModeButton",
  component: AttendanceModeButton,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [onSurface],
} satisfies Meta<typeof AttendanceModeButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Outline: Story = { args: { variant: "outline" } };
export const Small: Story = { args: { size: "sm" } };
export const IconOnly: Story = { args: { size: "icon", "aria-label": "Attendance Mode", title: "Attendance Mode", children: <span className="sr-only">Attendance Mode</span> } };
export const CustomLabel: Story = { args: { children: "Open the tablet screen" } };

/** Opens the kiosk's Start screen with a full page load, so no admin page stays behind it. */
export const OpensKiosk: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /attendance mode/i }));
    await expect(hardNavigate).toHaveBeenCalledWith("/attendance/kiosk");
  },
};
