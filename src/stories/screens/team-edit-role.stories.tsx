import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import EditRolePage from "@/app/(app)/team/roles/[id]/edit/page";
import { getRole } from "@/lib/access/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { adminRole, frontDeskRole, roleRows, teamLeadRole, teamLeadUser } from "@/stories/fixtures/team";
import { frontDeskUser } from "@/stories/fixtures/users";

function route(id: string) {
  return {
    args: { params: Promise.resolve({ id }), searchParams: Promise.resolve({}) },
    parameters: { nextjs: { navigation: { pathname: `/team/roles/${id}/edit` } } },
  };
}

const meta = {
  title: "Screens/Team/Edit role",
  component: EditRolePage,
  parameters: { layout: "fullscreen", ...route(frontDeskRole.id).parameters },
  decorators: [withAppShell],
  globals: { viewport: { value: "desktop" } },
  args: route(frontDeskRole.id).args,
  beforeEach: () => {
    mocked(getRole).mockImplementation(async (id) => roleRows.find((r) => r.id === id) ?? null);
  },
} satisfies Meta<typeof EditRolePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { name: "Edit Front desk" })).toBeVisible();
    await expect(await canvas.findByText(/Changes apply to the 3 users on this role/)).toBeVisible();
    await expect(canvas.getByLabelText("Name")).toHaveValue("Front desk");
  },
};

/** The built-in Administrator: read only, nothing to save. */
export const SystemRole: Story = {
  ...route(adminRole.id),
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { name: "Administrator" })).toBeVisible();
    await expect(await canvas.findByText(/Built in and read only. 2 users hold this role./)).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Save changes" })).toBeNull();
  },
};

/** Editing the role you hold: "Update a role" is locked on. */
export const OwnRole: Story = {
  ...route(teamLeadRole.id),
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(teamLeadUser);
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(await canvas.findByRole("heading", { name: "Edit Team lead" })).toBeVisible();
    await expect(canvasElement.querySelector("#perm-roles-update")).toBeDisabled();
    await expect(canvas.getByLabelText("Kept so you keep access to this screen")).toBeInTheDocument();
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
    await expect(await canvas.findByText(/Update a role/)).toBeVisible();
    await expect(getRole).not.toHaveBeenCalled();
  },
};
