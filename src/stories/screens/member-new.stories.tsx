import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, within } from "storybook/test";
import NewMemberPage from "@/app/(app)/members/new/page";
import { listActivePlans } from "@/lib/packages/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { plans } from "@/stories/fixtures/members";
import { TODAY } from "@/stories/fixtures/time";
import { noRoleUser } from "@/stories/fixtures/users";

const meta = {
  title: "Screens/Members/New",
  component: NewMemberPage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/members/new" } } },
  decorators: [withAppShell],
  beforeEach: () => {
    mocked(listActivePlans).mockResolvedValue(plans.filter((p) => p.isActive));
  },
} satisfies Meta<typeof NewMemberPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "New member" })).toBeVisible();
    const main = within(canvas.getByRole("main"));
    await expect(main.getByLabelText("Joined on")).toHaveValue(TODAY);
    await userEvent.click(main.getByRole("checkbox", { name: "Start a package now" }));
    // The active catalog plans, plus the placeholder.
    await expect(main.getByLabelText("Package").querySelectorAll("option")).toHaveLength(4);
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "New member" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Save member" })).toBeVisible();
  },
};

/** No packages in the catalog: the intake form points to Packages. */
export const NoPlans: Story = {
  beforeEach: () => {
    mocked(listActivePlans).mockResolvedValue([]);
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("checkbox", { name: "Start a package now" }));
    await expect(canvas.getByRole("link", { name: "Create one under Packages" })).toBeVisible();
  },
};

export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(noRoleUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(listActivePlans).not.toHaveBeenCalled();
  },
};
