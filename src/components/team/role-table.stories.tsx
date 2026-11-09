import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen, waitFor, within } from "storybook/test";
import { RoleTable } from "@/components/team/role-table";
import { deleteRole } from "@/lib/access/actions";
import { roleRows, STOCK_ROLE_ID } from "@/stories/fixtures/team";
import { fullCheck, knownIssues } from "@/stories/a11y";

const meta = {
  title: "Team/RoleTable",
  component: RoleTable,
  parameters: {
    layout: "padded",
    // Known issue: PermissionCoverage's "none" chips (a module the role has no
    // permission in) draw their label in text-muted-foreground/60 on white:
    // #a6a6a4 on #ffffff, 2.43:1 against the 4.5:1 AA minimum (color-contrast).
    // The faded, struck-through chip is the design's "not allowed" signal, so
    // raising it is a design call; stories without such chips keep the check on.
    a11y: knownIssues("color-contrast"),
  },
  globals: { viewport: { value: "desktop" } },
  args: { roles: roleRows, canCreate: true, canUpdate: true, canDelete: true },
} satisfies Meta<typeof RoleTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Edit and delete on every role. The built-in Administrator can only be
 * viewed; a role someone holds can't be deleted until they move off it.
 */
export const FullAccess: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "View Administrator" })).toHaveAttribute("href", expect.stringContaining("/edit"));
    await expect(canvas.getByRole("link", { name: "Edit Front desk" })).toBeVisible();
    await expect(canvas.getAllByRole("button", { name: "Delete (in use)" })[0]).toBeDisabled();
  },
};

/** View only: no actions column. */
export const ReadOnly: Story = {
  args: { canCreate: false, canUpdate: false, canDelete: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("columnheader", { name: "Actions" })).toBeNull();
  },
};

/** Deleting the unused Stock keeper role asks first, then calls the action. */
export const DeleteUnusedRole: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete Stock keeper?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(deleteRole).toHaveBeenCalledWith(STOCK_ROLE_ID));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};

export const Empty: Story = {
  args: { roles: [] },
  parameters: { a11y: fullCheck },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Create the first role" })).toHaveAttribute("href", "/team/roles/new");
  },
};

export const EmptyReadOnly: Story = {
  args: { roles: [], canCreate: false },
  parameters: { a11y: fullCheck },
};

/** Below `lg` the coverage chips move under the role name. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
};
