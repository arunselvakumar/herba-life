import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import MembersPage from "@/app/(app)/members/page";
import { listMembers } from "@/lib/members/queries";
import { withAppShell } from "@/stories/decorators";
import { memberRows } from "@/stories/fixtures/members";

const meta = {
  title: "Screens/Members/List",
  component: MembersPage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/members" } } },
  decorators: [withAppShell],
  args: { params: Promise.resolve({}), searchParams: Promise.resolve({}) },
  beforeEach: () => {
    mocked(listMembers).mockResolvedValue(memberRows);
  },
} satisfies Meta<typeof MembersPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Rahul Iyer")).toBeVisible();
  },
};
