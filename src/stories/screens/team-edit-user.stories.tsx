import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import EditUserPage from "@/app/(app)/team/users/[id]/edit/page";
import { getUser, listRoleOptions } from "@/lib/access/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { FRONT_DESK_ROLE_ID, frontDeskUserRow, roleOptions, userRows } from "@/stories/fixtures/team";
import { adminUser, frontDeskUser } from "@/stories/fixtures/users";

const meta = {
  title: "Screens/Team/Edit user",
  component: EditUserPage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: `/team/users/${frontDeskUserRow.id}/edit` } } },
  decorators: [withAppShell],
  globals: { viewport: { value: "desktop" } },
  args: { params: Promise.resolve({ id: frontDeskUserRow.id }), searchParams: Promise.resolve({}) },
  beforeEach: () => {
    mocked(listRoleOptions).mockResolvedValue(roleOptions);
    mocked(getUser).mockImplementation(async (id) => userRows.find((u) => u.id === id) ?? null);
  },
} satisfies Meta<typeof EditUserPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { name: `Edit ${frontDeskUser.name}` })).toBeVisible();
    await expect(await canvas.findByLabelText("Email")).toHaveValue(frontDeskUser.email);
    await expect(canvas.getByLabelText("Role")).toHaveValue(FRONT_DESK_ROLE_ID);
    await expect(canvas.getByLabelText("Role")).toBeEnabled();
  },
};

/** Your own account: the role can't be changed from here. */
export const EditingSelf: Story = {
  args: { params: Promise.resolve({ id: adminUser.id }) },
  parameters: { nextjs: { navigation: { pathname: `/team/users/${adminUser.id}/edit` } } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/Your own account/)).toBeVisible();
    await expect(await canvas.findByLabelText("Role")).toBeDisabled();
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("button", { name: "Save changes" })).toBeVisible();
  },
};

export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/Update a user/)).toBeVisible();
    await expect(getUser).not.toHaveBeenCalled();
  },
};
