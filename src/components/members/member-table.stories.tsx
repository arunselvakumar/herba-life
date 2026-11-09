import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { MemberTable } from "@/components/members/member-table";
import { onSurface } from "@/stories/decorators";
import { makeMember, memberRows } from "@/stories/fixtures/members";

const meta = {
  title: "Members/MemberTable",
  component: MemberTable,
  tags: ["autodocs"],
  decorators: [onSurface],
  args: { members: memberRows, emptyMessage: "No members yet." },
} satisfies Meta<typeof MemberTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One member in each package state: active, ending soon, upcoming, expired and none. */
export const MixedStates: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Priya Sharma" })).toHaveAttribute("href", `/members/${memberRows[0]?.id}`);
    await expect(canvas.getByText(/1 month · 3 days left/)).toBeVisible();
    await expect(canvas.getByText(/ended/)).toBeVisible();
    // No follow-up recorded yet, and no way to reach George but email.
    await expect(canvas.getAllByText("Never")).toHaveLength(2);
    await expect(canvas.getByText("george@example.com")).toBeVisible();
  },
};

export const NoContact: Story = {
  args: {
    members: [{ ...memberRows[0]!, ...makeMember({ serialNo: 106, firstName: "Kumar", lastName: "Subramaniam Venkataraghavan", mobile: null, email: null }) }],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No contact")).toBeVisible();
  },
};

export const EmptyWithCreate: Story = {
  args: { members: [], canCreate: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No members yet.")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Add a member" })).toHaveAttribute("href", "/members/new");
  },
};

export const EmptyReadOnly: Story = {
  args: { members: [], emptyMessage: "No members in this group." },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No members in this group.")).toBeVisible();
    await expect(canvas.queryByRole("link", { name: "Add a member" })).toBeNull();
  },
};

/** Below `sm`, only the number, name and contact show. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Rahul Iyer")).toBeVisible();
    await expect(canvas.queryByRole("columnheader", { name: "Joined" })).toBeNull();
    await expect(canvas.queryByRole("columnheader", { name: "Package" })).toBeNull();
  },
};
