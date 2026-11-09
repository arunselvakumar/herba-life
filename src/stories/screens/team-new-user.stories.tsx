import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor } from "storybook/test";
import NewUserPage from "@/app/(app)/team/users/new/page";
import { createUser } from "@/lib/access/actions";
import { listRoleOptions } from "@/lib/access/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { FRONT_DESK_ROLE_ID, roleOptions, teamLeadUser } from "@/stories/fixtures/team";

const meta = {
  title: "Screens/Team/New user",
  component: NewUserPage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/team/users/new" } } },
  decorators: [withAppShell],
  globals: { viewport: { value: "desktop" } },
  beforeEach: () => {
    mocked(listRoleOptions).mockResolvedValue(roleOptions);
  },
} satisfies Meta<typeof NewUserPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The role starts on the first staff role, not Administrator. */
export const Desktop: Story = {
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByRole("heading", { name: "New user" })).toBeVisible();
    await expect(await canvas.findByLabelText("Role")).toHaveValue(FRONT_DESK_ROLE_ID);
    await userEvent.type(canvas.getByLabelText("Name"), "Divya Krishnan");
    await userEvent.type(canvas.getByLabelText("Email"), "divya@herbalife.test");
    await userEvent.type(canvas.getByLabelText("Password"), "sunrise-2026");
    await userEvent.click(canvas.getByRole("button", { name: "Create user" }));
    await waitFor(() => expect(createUser).toHaveBeenCalledTimes(1));
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("button", { name: "Create user" })).toBeVisible();
  },
};

/** The team lead can edit users but not create them. */
export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(teamLeadUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/Create a user/)).toBeVisible();
    await expect(listRoleOptions).not.toHaveBeenCalled();
  },
};
