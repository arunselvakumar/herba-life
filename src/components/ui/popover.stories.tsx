import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, screen, waitFor, within } from "storybook/test";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

// The content renders in a portal on document.body: play functions query `screen`.
const meta = {
  title: "UI/Popover",
  component: Popover,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { onOpenChange: fn() },
  render: (args) => (
    <Popover {...args}>
      <PopoverTrigger asChild>
        <Button variant="outline">Set a reminder</Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Reminder">
        <PopoverHeader>
          <PopoverTitle>Follow-up reminder</PopoverTitle>
          <PopoverDescription>We&apos;ll list the inquiry on the dashboard that day.</PopoverDescription>
        </PopoverHeader>
        <div className="grid gap-2">
          <Label htmlFor="reminder-days">In how many days?</Label>
          <Input id="reminder-days" type="number" defaultValue={3} min={1} />
        </div>
      </PopoverContent>
    </Popover>
  ),
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: "Set a reminder" });
    await userEvent.click(trigger);
    const popover = await screen.findByRole("dialog", { name: "Reminder" });
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    // Radix keeps the content transparent until it has been positioned.
    await waitFor(() => expect(within(popover).getByText("Follow-up reminder")).toBeVisible());
    await expect(within(popover).getByRole("spinbutton", { name: "In how many days?" })).toHaveValue(3);

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
  },
};

export const Open: Story = {
  args: { defaultOpen: true },
  play: async () => {
    const popover = await screen.findByRole("dialog", { name: "Reminder" });
    await waitFor(() => expect(popover).toBeVisible());
  },
};
