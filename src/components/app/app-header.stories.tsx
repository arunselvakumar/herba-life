import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, within } from "storybook/test";
import { AppHeader } from "@/components/app/app-header";
import { getCurrentUser } from "@/lib/session";
import { frontDeskUser, noRoleUser } from "@/stories/fixtures/users";

/**
 * The header is a server component: the nav pills, quick actions and account
 * menu each read `getCurrentUser()` from the session mock. Override it to
 * see what a role without some permissions gets.
 */
const meta = {
  title: "App/AppHeader",
  component: AppHeader,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/dashboard" } } },
  globals: { viewport: { value: "desktop" } },
} satisfies Meta<typeof AppHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every module, Attendance Mode and New member. */
export const Admin: Story = {
  play: async ({ canvas }) => {
    const nav = await canvas.findByTestId("app-nav");
    await expect(await within(nav).findByRole("link", { name: "Team" })).toBeInTheDocument();
    await expect(within(nav).getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
    await expect(canvas.getAllByRole("link", { name: /new member/i }).length).toBeGreaterThan(0);
  },
};

/** No Packages or Team pills, and no Team or Export links in the account menu. */
export const FrontDesk: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas }) => {
    const nav = await canvas.findByTestId("app-nav");
    await expect(await within(nav).findByRole("link", { name: "Stock" })).toBeInTheDocument();
    await expect(within(nav).queryByRole("link", { name: "Team" })).toBeNull();
    await expect(within(nav).queryByRole("link", { name: "Packages" })).toBeNull();
  },
};

/** Signed in without a role: no pills and no quick actions, only the account menu. */
export const NoRole: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(noRoleUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByTestId("user-menu-trigger")).toBeVisible();
    await expect(canvas.queryByRole("link", { name: /new member/i })).toBeNull();
    await expect(within(canvas.getByTestId("app-nav")).queryAllByRole("link")).toHaveLength(0);
  },
};

/** Below `xl` the pills move to a full-width second row. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    const nav = await canvas.findByTestId("app-nav-compact");
    await expect(nav).toBeVisible();
    await expect(await within(nav).findByRole("link", { name: "Members" })).toBeInTheDocument();
  },
};
