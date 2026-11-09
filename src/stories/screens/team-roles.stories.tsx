import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import RolesPage from "@/app/(app)/team/roles/page";
import { listRoles } from "@/lib/access/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { roleRows, rolesOnlyUser } from "@/stories/fixtures/team";
import { frontDeskUser } from "@/stories/fixtures/users";
import { fullCheck, knownIssues } from "@/stories/a11y";

const meta = {
  title: "Screens/Team/Roles",
  component: RolesPage,
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/team/roles" } },
    // Known issue: the roles table's PermissionCoverage "none" chips draw
    // their label in text-muted-foreground/60 on white: #a6a6a4 on #ffffff,
    // 2.43:1 against the 4.5:1 AA minimum (color-contrast). The faded chip is
    // the design's "not allowed" signal, so raising it is a design call.
    a11y: knownIssues("color-contrast"),
  },
  decorators: [withAppShell],
  globals: { viewport: { value: "desktop" } },
  beforeEach: () => {
    mocked(listRoles).mockResolvedValue(roleRows);
  },
} satisfies Meta<typeof RolesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { name: "Roles" })).toBeVisible();
    await expect(await canvas.findByText("Wellness coach")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "New role" })).toHaveAttribute("href", "/team/roles/new");
    await expect(canvas.getByRole("link", { name: "Roles", current: "page" })).toBeVisible();
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Stock keeper")).toBeVisible();
  },
};

/** Can see roles but not users: no Users tab, no actions. */
export const RolesOnly: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(rolesOnlyUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Front desk")).toBeVisible();
    await expect(canvas.queryByRole("navigation", { name: "Team sections" })).toBeNull();
    await expect(canvas.queryByRole("link", { name: "New role" })).toBeNull();
  },
};

export const NoAccess: Story = {
  // No roles table, so no faded chips: the check stays on.
  parameters: { a11y: fullCheck },
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/View roles/)).toBeVisible();
    await expect(listRoles).not.toHaveBeenCalled();
  },
};
