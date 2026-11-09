import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import UsersPage from "@/app/(app)/team/users/page";
import { listUsers } from "@/lib/access/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { teamLeadUser, userRows } from "@/stories/fixtures/team";
import { frontDeskUser } from "@/stories/fixtures/users";

const meta = {
  title: "Screens/Team/Users",
  component: UsersPage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/team/users" } } },
  decorators: [withAppShell],
  globals: { viewport: { value: "desktop" } },
  beforeEach: () => {
    mocked(listUsers).mockResolvedValue(userRows);
  },
} satisfies Meta<typeof UsersPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { name: "Users" })).toBeVisible();
    await expect(await canvas.findByText("Suresh Venkataraman")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "New user" })).toHaveAttribute("href", "/team/users/new");
    await expect(canvas.getByRole("link", { name: "Export" })).toHaveAttribute("href", "/api/export/users");
    await expect(canvas.getByRole("navigation", { name: "Team sections" })).toBeVisible();
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Anand Pillai")).toBeVisible();
  },
};

/** Can view and edit users but not create, delete or export them. */
export const TeamLead: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(teamLeadUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Divya Krishnan")).toBeVisible();
    await expect(canvas.queryByRole("link", { name: "New user" })).toBeNull();
    await expect(canvas.queryByRole("link", { name: "Export" })).toBeNull();
    await expect(canvas.getAllByRole("link", { name: /^Edit / })).toHaveLength(userRows.length);
  },
};

export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(canvas.getByText(/View users/)).toBeVisible();
    await expect(listUsers).not.toHaveBeenCalled();
  },
};
