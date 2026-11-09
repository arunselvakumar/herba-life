import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, screen, waitFor, within } from "storybook/test";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Dialogs render in a portal on document.body, so the play functions query
// `screen` rather than the story canvas.
const meta = {
  title: "UI/Dialog",
  component: Dialog,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { onOpenChange: fn() },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button variant="outline">Void sale</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Void sale #42?</DialogTitle>
          <DialogDescription>The 2 items go back into stock and the sale stays on record as voided.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Keep sale</Button>
          </DialogClose>
          <Button variant="destructive">Void sale</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  // Left open, so the accessibility check covers the open dialog.
  play: async () => {
    const dialog = await screen.findByRole("dialog", { name: "Void sale #42?" });
    await expect(dialog).toBeVisible();
    await expect(within(dialog).getByRole("button", { name: "Close" })).toBeInTheDocument();
  },
};

export const WithForm: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button>Mark as lost</Button>
      </DialogTrigger>
      <DialogContent>
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Mark inquiry as lost</DialogTitle>
            <DialogDescription>Say why, so the follow-up report stays honest.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="lost-reason">Reason</Label>
            <Input id="lost-reason" name="reason" placeholder="Joined another gym" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lost-notes">Notes</Label>
            <Textarea id="lost-notes" name="notes" />
          </div>
          <DialogFooter showCloseButton>
            <Button type="submit">Mark lost</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Mark as lost" }));
    const dialog = await screen.findByRole("dialog", { name: "Mark inquiry as lost" });
    await expect(args.onOpenChange).toHaveBeenCalledWith(true);

    // Focus moves into the dialog, onto the first field.
    const reason = within(dialog).getByRole("textbox", { name: "Reason" });
    await waitFor(() => expect(reason).toHaveFocus());
    await userEvent.type(reason, "Moved to Pune");
    await expect(reason).toHaveValue("Moved to Pune");

    // Two ways out: the corner X and the footer's Close. The footer's comes first.
    const closes = within(dialog).getAllByRole("button", { name: "Close" });
    await expect(closes).toHaveLength(2);
    await userEvent.click(closes[0]!);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
  },
};

export const WithoutCloseButton: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button variant="outline">Sign out</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Sign out of the kiosk?</DialogTitle>
          <DialogDescription>The tablet returns to the sign-in screen.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Stay signed in</Button>
          </DialogClose>
          <Button>Sign out</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Sign out" }));
    const dialog = await screen.findByRole("dialog", { name: "Sign out of the kiosk?" });
    await expect(within(dialog).queryByRole("button", { name: "Close" })).not.toBeInTheDocument();

    // Escape still closes it.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    // And it opens again; the footer button closes it too.
    await userEvent.click(canvas.getByRole("button", { name: "Sign out" }));
    const again = await screen.findByRole("dialog");
    await userEvent.click(within(again).getByRole("button", { name: "Stay signed in" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  },
};
