import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor } from "storybook/test";
import NewRolePage from "@/app/(app)/team/roles/new/page";
import { createRole } from "@/lib/access/actions";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { teamLeadUser } from "@/stories/fixtures/team";

const meta = {
  title: "Screens/Team/New role",
  component: NewRolePage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/team/roles/new" } } },
  decorators: [withAppShell],
  globals: { viewport: { value: "desktop" } },
} satisfies Meta<typeof NewRolePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByRole("heading", { name: "New role" })).toBeVisible();
    await userEvent.type(await canvas.findByLabelText("Name"), "Stock keeper");
    await userEvent.click(canvas.getByRole("button", { name: "Create role" }));
    await waitFor(() => expect(createRole).toHaveBeenCalledTimes(1));
    await expect(mocked(createRole).mock.calls[0]?.[1].getAll("permissions[]")).toEqual(["dashboard.view"]);
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("button", { name: "Create role" })).toBeVisible();
  },
};

/** The team lead can update roles but not create them. */
export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(teamLeadUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/Create a role/)).toBeVisible();
  },
};
