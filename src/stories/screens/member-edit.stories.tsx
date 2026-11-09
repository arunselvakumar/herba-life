import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor, within } from "storybook/test";
import EditMemberPage from "@/app/(app)/members/[id]/edit/page";
import { updateMember } from "@/lib/members/actions";
import { getMember } from "@/lib/members/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { memberWithHealth } from "@/stories/fixtures/members";
import { frontDeskUser } from "@/stories/fixtures/users";

const member = memberWithHealth;

const meta = {
  title: "Screens/Members/Edit",
  component: EditMemberPage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: `/members/${member.id}/edit` } } },
  decorators: [withAppShell],
  args: { params: Promise.resolve({ id: member.id }), searchParams: Promise.resolve({}) },
  beforeEach: () => {
    mocked(getMember).mockResolvedValue(member);
  },
} satisfies Meta<typeof EditMemberPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "Edit Priya Sharma" })).toBeVisible();
    const main = within(canvas.getByRole("main"));
    await expect(main.getByLabelText("First name")).toHaveValue("Priya");
    await expect(main.getByRole("checkbox", { name: "Sugar / diabetes" })).toBeChecked();
    await expect(main.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", `/members/${member.id}`);
    await expect(getMember).toHaveBeenCalledWith(member.id);
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "Edit Priya Sharma" })).toBeVisible();
  },
};

/** Saving calls `updateMember` bound to the member's id. */
export const Save: Story = {
  play: async ({ canvas, userEvent }) => {
    const mobile = await canvas.findByLabelText("Mobile");
    await userEvent.clear(mobile);
    await userEvent.type(mobile, "98400 99999");
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(updateMember).toHaveBeenCalledOnce());
    const [id, , data] = mocked(updateMember).mock.calls[0]!;
    await expect(id).toBe(member.id);
    await expect(data instanceof FormData && data.get("mobile")).toBe("98400 99999");
  },
};

/** Front desk can add members but not change them. */
export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(getMember).not.toHaveBeenCalled();
  },
};
