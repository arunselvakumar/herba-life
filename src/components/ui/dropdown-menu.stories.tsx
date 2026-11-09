import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChevronDownIcon, DownloadIcon, LogOutIcon, PencilIcon, Trash2Icon, UserIcon } from "lucide-react";
import { useState } from "react";
import { expect, fn, screen, waitFor, within } from "storybook/test";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Menus render in a portal on document.body: play functions query `screen`.
const meta = {
  title: "UI/DropdownMenu",
  component: DropdownMenu,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { onOpenChange: fn() },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const closed = () => waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());

export const Basic: Story = {
  render: (args) => (
    <DropdownMenu {...args}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Actions
          <ChevronDownIcon data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuItem>
          <PencilIcon />
          Edit member
        </DropdownMenuItem>
        <DropdownMenuItem>
          <DownloadIcon />
          Export visits
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <UserIcon />
          Merge duplicates
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Actions" }));
    const menu = await screen.findByRole("menu");
    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(within(menu).getAllByRole("menuitem")).toHaveLength(3);
    await expect(within(menu).getByRole("menuitem", { name: "Merge duplicates" })).toHaveAttribute("aria-disabled", "true");

    await userEvent.keyboard("{Escape}");
    await closed();
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
  },
};

export const DestructiveItem: Story = {
  render: (args) => (
    <DropdownMenu {...args}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Row actions">
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-44">
        <DropdownMenuItem>
          <PencilIcon />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2Icon />
          Delete check-in
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Row actions" }));
    const menu = await screen.findByRole("menu");
    const remove = within(menu).getByRole("menuitem", { name: "Delete check-in" });
    await expect(remove).toHaveAttribute("data-variant", "destructive");

    // Choosing an item closes the menu.
    await userEvent.click(remove);
    await closed();
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
  },
};

function ViewMenu() {
  const [showArchived, setShowArchived] = useState(false);
  const [showVoided, setShowVoided] = useState(true);
  const [sort, setSort] = useState("name");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">View</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52">
        <DropdownMenuLabel>Show</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked={showArchived} onCheckedChange={setShowArchived}>
          Archived products
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={showVoided} onCheckedChange={setShowVoided}>
          Voided sales
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
          <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="stock">Stock left</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="updated">Last updated</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const CheckboxAndRadioItems: Story = {
  render: () => <ViewMenu />,
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: "View" });
    await userEvent.click(trigger);
    let menu = await screen.findByRole("menu");
    await expect(within(menu).getByRole("menuitemcheckbox", { name: "Archived products" })).not.toBeChecked();
    await expect(within(menu).getByRole("menuitemcheckbox", { name: "Voided sales" })).toBeChecked();
    await expect(within(menu).getByRole("menuitemradio", { name: "Name" })).toBeChecked();

    await userEvent.click(within(menu).getByRole("menuitemcheckbox", { name: "Archived products" }));
    await closed();

    await userEvent.click(trigger);
    menu = await screen.findByRole("menu");
    await expect(within(menu).getByRole("menuitemcheckbox", { name: "Archived products" })).toBeChecked();
    await userEvent.click(within(menu).getByRole("menuitemradio", { name: "Stock left" }));
    await closed();

    await userEvent.click(trigger);
    menu = await screen.findByRole("menu");
    await expect(within(menu).getByRole("menuitemradio", { name: "Stock left" })).toBeChecked();
    await expect(within(menu).getByRole("menuitemradio", { name: "Name" })).not.toBeChecked();
    await userEvent.keyboard("{Escape}");
    await closed();
  },
};

export const WithShortcuts: Story = {
  render: (args) => (
    <DropdownMenu {...args} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Arun Selva Kumar</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end">
        <DropdownMenuLabel>arun@herbalife.test</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Export data
            <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOutIcon />
          Sign out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  // Left open, so the accessibility check covers the open menu's content.
  // Non-modal on purpose: a modal menu aria-hides the rest of the page while
  // its trigger stays focusable, which axe reports as aria-hidden-focus (a
  // Radix behaviour shared by every modal menu, e.g. the user menu). Kept
  // last in the file so the open menu can't leak into another story.
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Arun Selva Kumar" }));
    const menu = await screen.findByRole("menu");
    // Radix keeps the menu transparent until it has been positioned.
    await waitFor(() => expect(within(menu).getByText("arun@herbalife.test")).toBeVisible());
    await expect(within(menu).getByText("⌘E")).toBeVisible();
  },
};
