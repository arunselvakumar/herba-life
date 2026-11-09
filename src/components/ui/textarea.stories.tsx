import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { placeholder: "What did they ask about?", className: "w-80" },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { "aria-label": "Notes" },
};

export const WithLabel: Story = {
  render: (args) => (
    <div className="grid gap-2">
      <Label htmlFor="notes">Notes</Label>
      <Textarea id="notes" {...args} />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const notes = canvas.getByRole("textbox", { name: "Notes" });
    await userEvent.type(notes, "Wants a weight-loss plan.{Enter}Call back after 6 pm.");
    await expect(notes).toHaveValue("Wants a weight-loss plan.\nCall back after 6 pm.");
  },
};

export const Invalid: Story = {
  args: { "aria-invalid": true, "aria-describedby": "notes-error" },
  render: (args) => (
    <div className="grid gap-2">
      <Label htmlFor="notes-invalid">Reason</Label>
      <Textarea id="notes-invalid" {...args} />
      <p id="notes-error" className="text-xs text-destructive">
        Say why the inquiry was lost.
      </p>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, "aria-label": "Notes", defaultValue: "Converted to a member on 2 Nov 2026." },
};

export const LongText: Story = {
  args: {
    "aria-label": "Notes",
    defaultValue:
      "Came in with her sister. Interested in the 3-month package but wants to try a week first.\n\nAsked about the morning batch timings and whether the shakes are vegetarian. Follow up on Thursday.",
  },
};
