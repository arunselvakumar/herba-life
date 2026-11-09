import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, within } from "storybook/test";
import PackagesPage from "@/app/(app)/packages/page";
import type { Permission } from "@/lib/access/permissions";
import { listPlans } from "@/lib/packages/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { planRows } from "@/stories/fixtures/members";
import { frontDeskUser, noRoleUser } from "@/stories/fixtures/users";

/** Can see the catalog but not change it. */
const catalogViewer = {
  ...frontDeskUser,
  permissions: [...frontDeskUser.permissions, "packages.view"] satisfies Permission[],
};

const meta = {
  title: "Screens/Packages/List",
  component: PackagesPage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/packages" } } },
  decorators: [withAppShell],
  beforeEach: () => {
    mocked(listPlans).mockResolvedValue(planRows);
  },
} satisfies Meta<typeof PackagesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "Packages" })).toBeVisible();
    const main = within(canvas.getByRole("main"));
    await expect(main.getByText("6 months")).toBeVisible();
    await expect(main.getByRole("link", { name: "New package" })).toHaveAttribute("href", "/packages/new");
    await expect(main.getByRole("link", { name: "Export" })).toBeVisible();
    await expect(main.getByRole("columnheader", { name: "Actions" })).toBeVisible();
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "Packages" })).toBeVisible();
    await expect(canvas.getByText("Trial week")).toBeVisible();
  },
};

export const Empty: Story = {
  beforeEach: () => {
    mocked(listPlans).mockResolvedValue([]);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("No packages yet")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Create the first package" })).toBeVisible();
  },
};

/** packages.view only: no actions, and the description says who to ask. */
export const ReadOnly: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(catalogViewer);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/Ask an administrator to add or change packages/)).toBeVisible();
    const main = within(canvas.getByRole("main"));
    await expect(main.queryByRole("link", { name: "New package" })).toBeNull();
    await expect(main.queryByRole("columnheader", { name: "Actions" })).toBeNull();
  },
};

/** No role yet: no packages.view. */
export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(noRoleUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(listPlans).not.toHaveBeenCalled();
  },
};
