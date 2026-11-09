import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor, within } from "storybook/test";
import NewPackagePage from "@/app/(app)/members/[id]/packages/new/page";
import { createPackage } from "@/lib/members/actions";
import { getMember } from "@/lib/members/queries";
import { listActivePlans } from "@/lib/packages/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { memberWithEverything, plans } from "@/stories/fixtures/members";
import { TODAY } from "@/stories/fixtures/time";
import { frontDeskUser } from "@/stories/fixtures/users";

const member = memberWithEverything;
const activePlans = plans.filter((p) => p.isActive);

const meta = {
  title: "Screens/Members/NewPackage",
  component: NewPackagePage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: `/members/${member.id}/packages/new` } } },
  decorators: [withAppShell],
  args: { params: Promise.resolve({ id: member.id }), searchParams: Promise.resolve({}) },
  beforeEach: () => {
    mocked(getMember).mockResolvedValue(member);
    mocked(listActivePlans).mockResolvedValue(activePlans);
  },
} satisfies Meta<typeof NewPackagePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "New package for Priya Sharma" })).toBeVisible();
    const main = within(canvas.getByRole("main"));
    await expect(main.getByText("Member #101")).toBeVisible();
    await expect(main.getByLabelText("Start date")).toHaveValue(TODAY);
    await expect(main.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", `/members/${member.id}`);
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "New package for Priya Sharma" })).toBeVisible();
  },
};

/** Enrolling calls `createPackage` bound to the member's id. */
export const Enrol: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.selectOptions(await canvas.findByLabelText("Package"), activePlans[0]!.id);
    await userEvent.click(canvas.getByRole("button", { name: "Enrol in package" }));
    await waitFor(() => expect(createPackage).toHaveBeenCalledOnce());
    const [id, , data] = mocked(createPackage).mock.calls[0]!;
    await expect(id).toBe(member.id);
    await expect(data instanceof FormData && data.get("planId")).toBe(activePlans[0]!.id);
  },
};

export const NoPlans: Story = {
  beforeEach: () => {
    mocked(listActivePlans).mockResolvedValue([]);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/No packages in the catalog yet/)).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Enrol in package" })).toBeDisabled();
  },
};

/** Front desk can't manage packages. */
export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(getMember).not.toHaveBeenCalled();
  },
};
