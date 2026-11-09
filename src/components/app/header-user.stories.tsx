import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, screen, userEvent as user, waitFor } from "storybook/test";
import { HeaderUser, HeaderUserSkeleton } from "@/components/app/header-user";
import { getCurrentUser } from "@/lib/session";
import { frontDeskUser } from "@/stories/fixtures/users";

/**
 * The server half of the account menu: reads the session and decides which
 * links the menu offers. Shown at desktop width, where the first name shows.
 */
const meta = {
  title: "App/HeaderUser",
  component: HeaderUser,
  parameters: { layout: "centered" },
  globals: { viewport: { value: "desktop" } },
} satisfies Meta<typeof HeaderUser>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Radix hides the page while the menu is open; close it so the a11y check sees the page. */
async function closeMenu() {
  await user.keyboard("{Escape}");
  await waitFor(() => expect(document.querySelector("[data-aria-hidden]")).toBeNull());
}

export const Admin: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Account: Arun Selva Kumar" }));
    await expect(await screen.findByRole("menuitem", { name: /users & roles/i })).toBeInTheDocument();
    await expect(screen.getByRole("menuitem", { name: /backup & export/i })).toBeInTheDocument();
    await closeMenu();
  },
};

/** No users, roles or export permissions: the menu leaves those links out. */
export const FrontDesk: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Account: Meena Raghavan" }));
    await expect(await screen.findByRole("menuitem", { name: /change password/i })).toBeInTheDocument();
    await expect(screen.queryByRole("menuitem", { name: /users & roles/i })).toBeNull();
    await closeMenu();
  },
};

/** The Suspense fallback while the session is read. */
export const Skeleton: Story = {
  render: () => <HeaderUserSkeleton />,
};
