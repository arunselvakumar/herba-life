import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import TeamPage from "@/app/(app)/team/page";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { noRoleUser } from "@/stories/fixtures/users";

/**
 * `/team` only redirects: to Users, or to Roles when that is all the role
 * unlocks. Those land on their own screens, so the one state worth showing
 * here is a role with neither.
 */
const meta = {
  title: "Screens/Team/Landing",
  component: TeamPage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/team" } } },
  decorators: [withAppShell],
  globals: { viewport: { value: "desktop" } },
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(noRoleUser);
  },
} satisfies Meta<typeof TeamPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoAccess: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(canvas.getByText(/View users/)).toBeVisible();
  },
};

export const NoAccessMobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
  },
};
