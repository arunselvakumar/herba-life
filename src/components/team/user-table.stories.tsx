import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen, waitFor, within } from "storybook/test";
import { UserTable } from "@/components/team/user-table";
import { deleteUser, setUserActive } from "@/lib/access/actions";
import { NOW } from "@/stories/fixtures/time";
import { userRows } from "@/stories/fixtures/team";
import { adminUser, frontDeskUser } from "@/stories/fixtures/users";

const meta = {
  title: "Team/UserTable",
  component: UserTable,
  parameters: { layout: "padded" },
  globals: { viewport: { value: "desktop" } },
  args: { users: userRows, currentUserId: adminUser.id, now: NOW, canCreate: true, canUpdate: true, canDelete: true },
} satisfies Meta<typeof UserTable>;

export default meta;
type Story = StoryObj<typeof meta>;

function rowOf(name: string): HTMLElement {
  const row = screen.getByText(name).closest("tr");
  if (!row) throw new Error(`No row for ${name}`);
  return row;
}

/**
 * Active and suspended users, one without a role and one who never signed in.
 * The administrator's own row is marked "You" and can only be edited.
 */
export const AdminView: Story = {
  play: async () => {
    const self = rowOf(adminUser.name);
    await expect(within(self).getByText("You")).toBeVisible();
    await expect(within(self).queryByRole("button", { name: "Suspend" })).toBeNull();
    await expect(within(self).queryByRole("button", { name: "Delete" })).toBeNull();
    await expect(within(rowOf("Suresh Venkataraman")).getByText("No role")).toBeVisible();
    await expect(within(rowOf("Suresh Venkataraman")).getByText("Never signed in")).toBeVisible();
    await expect(within(rowOf("Anand Pillai")).getByText("Suspended")).toBeVisible();
  },
};

/** Seen from another account: the "You" badge moves to that row. */
export const SelfRow: Story = {
  args: { currentUserId: frontDeskUser.id, canDelete: false },
  play: async () => {
    await expect(within(rowOf(frontDeskUser.name)).getByText("You")).toBeVisible();
    await expect(within(rowOf(adminUser.name)).getByRole("button", { name: "Suspend" })).toBeVisible();
  },
};

/** View only: no actions column. */
export const ReadOnly: Story = {
  args: { canCreate: false, canUpdate: false, canDelete: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("columnheader", { name: "Actions" })).toBeNull();
  },
};

export const SuspendUser: Story = {
  play: async ({ userEvent }) => {
    await userEvent.click(within(rowOf(frontDeskUser.name)).getByRole("button", { name: "Suspend" }));
    const dialog = await screen.findByRole("dialog", { name: `Suspend ${frontDeskUser.name}?` });
    await userEvent.click(within(dialog).getByRole("button", { name: "Suspend" }));
    await waitFor(() => expect(setUserActive).toHaveBeenCalledWith(frontDeskUser.id, false));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};

export const RestoreUser: Story = {
  play: async ({ userEvent }) => {
    await userEvent.click(within(rowOf("Anand Pillai")).getByRole("button", { name: "Restore" }));
    const dialog = await screen.findByRole("dialog", { name: "Restore Anand Pillai?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Restore" }));
    await waitFor(() => expect(setUserActive).toHaveBeenCalledWith("0b5a8c1e-7e1f-4f53-9a43-3c2f7f0a0012", true));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};

export const DeleteUser: Story = {
  play: async ({ userEvent }) => {
    await userEvent.click(within(rowOf("Divya Krishnan")).getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete Divya Krishnan?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete user" }));
    await waitFor(() => expect(deleteUser).toHaveBeenCalledWith("0b5a8c1e-7e1f-4f53-9a43-3c2f7f0a0010"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};

export const Empty: Story = {
  args: { users: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Add a user" })).toHaveAttribute("href", "/team/users/new");
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
};
