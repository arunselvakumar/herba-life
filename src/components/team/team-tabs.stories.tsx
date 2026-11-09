import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { TeamTabs } from "@/components/team/team-tabs";

const meta = {
  title: "Team/TeamTabs",
  component: TeamTabs,
  parameters: { layout: "padded", nextjs: { navigation: { pathname: "/team/users" } } },
  args: { show: { users: true, roles: true } },
} satisfies Meta<typeof TeamTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UsersActive: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Users" })).toHaveAttribute("aria-current", "page");
    await expect(canvas.getByRole("link", { name: "Roles" })).not.toHaveAttribute("aria-current");
  },
};

/** A sub-route, such as editing a role, keeps its tab active. */
export const RolesActive: Story = {
  parameters: { nextjs: { navigation: { pathname: "/team/roles/5e1a0000-0000-4000-8000-000000000002/edit" } } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Roles" })).toHaveAttribute("aria-current", "page");
  },
};

/** With only one section unlocked there is nothing to switch to, so nothing renders. */
export const UsersOnly: Story = {
  args: { show: { users: true, roles: false } },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("navigation")).toBeNull();
  },
};
