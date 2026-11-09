import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, within } from "storybook/test";
import MembersPage from "@/app/(app)/members/page";
import { listMembers } from "@/lib/members/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { memberRows, memberRowsByFilter } from "@/stories/fixtures/members";
import { TODAY } from "@/stories/fixtures/time";
import { frontDeskUser, noRoleUser } from "@/stories/fixtures/users";

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
    await expect(canvas.getByText("5 members")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "All" })).toHaveAttribute("aria-current", "page");
    // The header's quick actions have a "New member" link too; check the page's own.
    const main = within(canvas.getByRole("main"));
    await expect(main.getByRole("link", { name: "New member" })).toHaveAttribute("href", "/members/new");
    await expect(main.getByRole("link", { name: "Export" })).toBeVisible();
    await expect(listMembers).toHaveBeenCalledWith({ q: undefined, filter: "all", today: TODAY });
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Lakshmi Narayanan")).toBeVisible();
    await expect(canvas.getByRole("searchbox", { name: "Search members" })).toBeVisible();
  },
};

/** One story per filter chip: the page passes the filter to `listMembers` and marks the chip current. */
function filterStory(filter: "active" | "due" | "expiring" | "no-package", label: string, expected: string): Story {
  return {
    args: { searchParams: Promise.resolve({ filter }) },
    beforeEach: () => {
      mocked(listMembers).mockResolvedValue(memberRowsByFilter[filter]);
    },
    play: async ({ canvas }) => {
      await expect(await canvas.findByText(expected)).toBeVisible();
      await expect(canvas.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
      await expect(listMembers).toHaveBeenCalledWith({ q: undefined, filter, today: TODAY });
      const rows = memberRowsByFilter[filter].length;
      await expect(canvas.getByText(`${rows} member${rows === 1 ? "" : "s"}`)).toBeVisible();
    },
  };
}

export const OnAPackage = filterStory("active", "On a package", "Priya Sharma");
export const FollowUpDue = filterStory("due", "Follow-up due", "Rahul Iyer");
export const EndingSoon = filterStory("expiring", "Ending soon", "Rahul Iyer");
export const NoPackage = filterStory("no-package", "No package", "George Mathew");

/** A search keeps the filter in the form and the count says what matched. */
export const Search: Story = {
  args: { searchParams: Promise.resolve({ q: "priya", filter: "active" }) },
  beforeEach: () => {
    mocked(listMembers).mockResolvedValue(memberRows.slice(0, 1));
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("1 member matching “priya”")).toBeVisible();
    await expect(canvas.getByRole("searchbox", { name: "Search members" })).toHaveValue("priya");
    await expect(canvas.getByRole("link", { name: "All" })).toHaveAttribute("href", "/members?q=priya");
    await expect(listMembers).toHaveBeenCalledWith({ q: "priya", filter: "active", today: TODAY });
  },
};

export const SearchNoMatch: Story = {
  args: { searchParams: Promise.resolve({ q: "zzz" }) },
  beforeEach: () => {
    mocked(listMembers).mockResolvedValue([]);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("No members match that search.")).toBeVisible();
  },
};

/** A new branch: nobody enrolled yet. */
export const Empty: Story = {
  beforeEach: () => {
    mocked(listMembers).mockResolvedValue([]);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("No members yet.")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Add a member" })).toHaveAttribute("href", "/members/new");
  },
};

/** An empty filter. */
export const EmptyGroup: Story = {
  args: { searchParams: Promise.resolve({ filter: "expiring" }) },
  beforeEach: () => {
    mocked(listMembers).mockResolvedValue([]);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("No members in this group.")).toBeVisible();
  },
};

/** Front desk can add members but not export. */
export const FrontDesk: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Rahul Iyer")).toBeVisible();
    const main = within(canvas.getByRole("main"));
    await expect(main.getByRole("link", { name: "New member" })).toBeVisible();
    await expect(main.queryByRole("link", { name: "Export" })).toBeNull();
  },
};

export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(noRoleUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(listMembers).not.toHaveBeenCalled();
  },
};
