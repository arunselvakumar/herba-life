import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { onSurface } from "@/stories/decorators";

const meta = {
  title: "UI/Checkbox",
  component: Checkbox,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [onSurface],
  args: { "aria-label": "Send WhatsApp reminders", onCheckedChange: fn() },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = { args: { defaultChecked: true } };

export const Indeterminate: Story = {
  args: { checked: "indeterminate", "aria-label": "Select all members" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("checkbox")).toBePartiallyChecked();
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultChecked: true },
  play: async ({ args, canvas, userEvent }) => {
    const box = canvas.getByRole("checkbox");
    await expect(box).toBeDisabled();
    await userEvent.click(box);
    await expect(args.onCheckedChange).not.toHaveBeenCalled();
  },
};

export const Invalid: Story = { args: { "aria-invalid": true } };

export const WithLabel: Story = {
  render: (args) => (
    <div className="flex items-start gap-3">
      <Checkbox {...args} id="reminders" aria-label={undefined} aria-describedby="reminders-hint" />
      <div className="grid gap-1.5">
        <Label htmlFor="reminders">Send WhatsApp reminders</Label>
        <p id="reminders-hint" className="text-xs text-muted-foreground">
          A day before each check-in.
        </p>
      </div>
    </div>
  ),
  play: async ({ args, canvas, userEvent }) => {
    const box = canvas.getByRole("checkbox", { name: "Send WhatsApp reminders" });
    await expect(box).not.toBeChecked();

    // Clicking the label toggles the box, like a native checkbox.
    await userEvent.click(canvas.getByText("Send WhatsApp reminders"));
    await expect(box).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);

    await userEvent.click(box);
    await expect(box).not.toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenLastCalledWith(false);
  },
};
