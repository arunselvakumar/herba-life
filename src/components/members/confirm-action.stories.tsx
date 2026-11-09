import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Trash2Icon } from "lucide-react";
import { expect, fn, screen, waitFor, within } from "storybook/test";
import { ConfirmAction } from "@/components/members/confirm-action";

const meta = {
  title: "Members/ConfirmAction",
  component: ConfirmAction,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    action: fn(async () => {}),
    title: "Mark package as completed?",
    description: "The member finished this programme. You can still create a new package afterwards.",
    confirmLabel: "Mark completed",
    children: "Mark completed",
  },
} satisfies Meta<typeof ConfirmAction>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Open: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Mark completed" }));
    const dialog = await screen.findByRole("dialog", { name: "Mark package as completed?" });
    await waitFor(() => expect(dialog).toBeVisible());
  },
};

/** "Keep" closes the dialog without running the action. */
export const Keep: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Mark completed" }));
    await userEvent.click(await screen.findByRole("button", { name: "Keep" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await expect(args.action).not.toHaveBeenCalled();
  },
};

export const Destructive: Story = {
  args: {
    title: "Delete this package?",
    description: "This removes the package record permanently.",
    confirmLabel: "Delete",
    destructive: true,
    variant: "ghost",
    className: "text-muted-foreground",
    children: (
      <>
        <Trash2Icon />
        Delete
      </>
    ),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete this package?" });
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(dialog).toHaveTextContent("This removes the package record permanently.");
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    await expect(args.action).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};
