import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { expect, screen, userEvent as user, waitFor } from "storybook/test";
import { UserMenu } from "@/components/app/user-menu";
import { authClient } from "@/lib/auth-client";
import { adminUser, frontDeskUser, noRoleUser } from "@/stories/fixtures/users";

const meta = {
  title: "App/UserMenu",
  component: UserMenu,
  parameters: { layout: "centered" },
  args: { user: adminUser, canManageTeam: true, canExport: true },
} satisfies Meta<typeof UserMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Close the menu before the story ends. While it is open Radix hides the rest
 * of the page with aria-hidden, trigger included, and the accessibility check
 * (which runs after `play`) would report that as aria-hidden-focus.
 */
async function closeMenu() {
  if (screen.queryByRole("menu")) await user.keyboard("{Escape}");
  await waitFor(() => expect(document.querySelector("[data-aria-hidden]")).toBeNull());
}

export const Closed: Story = {};

/** Every entry: the role, Users & roles, Backup & export, password and sign out. */
export const Admin: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByTestId("user-menu-trigger"));
    const menu = await screen.findByRole("menu");
    await expect(menu).toHaveTextContent("Role: Administrator");
    await expect(screen.getByRole("menuitem", { name: /users & roles/i })).toHaveAttribute("href", "/team");
    await expect(screen.getByRole("menuitem", { name: /backup & export/i })).toHaveAttribute("href", "/export");
    await closeMenu();
  },
};

/** Front desk: no team or export permissions, so those links are left out. */
export const NoTeamAccess: Story = {
  args: { user: frontDeskUser, canManageTeam: false, canExport: false },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByTestId("user-menu-trigger"));
    await expect(await screen.findByRole("menu")).toHaveTextContent("Role: Front desk");
    await expect(screen.queryByRole("menuitem", { name: /users & roles/i })).toBeNull();
    await expect(screen.queryByRole("menuitem", { name: /backup & export/i })).toBeNull();
    await closeMenu();
  },
};

/** Can manage the team but not export. */
export const NoExport: Story = {
  args: { canExport: false },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByTestId("user-menu-trigger"));
    await expect(await screen.findByRole("menuitem", { name: /users & roles/i })).toBeInTheDocument();
    await expect(screen.queryByRole("menuitem", { name: /backup & export/i })).toBeNull();
    await closeMenu();
  },
};

export const NoRoleAssigned: Story = {
  args: { user: noRoleUser, canManageTeam: false, canExport: false },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByTestId("user-menu-trigger"));
    await expect(await screen.findByRole("menu")).toHaveTextContent("No role assigned");
    await closeMenu();
  },
};

/** Sign out calls Better Auth, then sends the person to the login page. */
export const SignsOut: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByTestId("user-menu-trigger"));
    await userEvent.click(await screen.findByRole("menuitem", { name: /sign out/i }));
    await waitFor(() => expect(authClient.signOut).toHaveBeenCalled());
    await waitFor(() => expect(getRouter().replace).toHaveBeenCalledWith("/login"));
    await expect(getRouter().refresh).toHaveBeenCalled();
    await closeMenu();
  },
};

/** "Change password" opens the dialog with a blank form. */
export const OpensChangePassword: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByTestId("user-menu-trigger"));
    await userEvent.click(await screen.findByRole("menuitem", { name: /change password/i }));
    const dialog = await screen.findByRole("dialog", { name: "Change password" });
    await expect(dialog).toBeVisible();
    await expect(screen.getByLabelText(/^new password/i)).toHaveValue("");
  },
};
