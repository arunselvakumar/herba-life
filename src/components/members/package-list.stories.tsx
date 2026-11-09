import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen, waitFor, within } from "storybook/test";
import { PackageList } from "@/components/members/package-list";
import { deletePackage, setPackageStatus } from "@/lib/members/actions";
import { memberWithEverything, packagesInEveryState as pkgs } from "@/stories/fixtures/members";
import { TODAY } from "@/stories/fixtures/time";
import { knownIssues } from "@/stories/a11y";

const memberId = memberWithEverything.id;

const meta = {
  title: "Members/PackageList",
  component: PackageList,
  tags: ["autodocs"],
  args: { memberId, packages: [pkgs.active], today: TODAY, canManage: true },
} satisfies Meta<typeof PackageList>;

export default meta;

/** For stories that show an open package's progress bar. */
const progressTodo = {
  // Known issue: the open package's <Progress> (role="progressbar") in PackageItem has no
  // accessible name (aria-progressbar-name, WCAG 1.1.1). Fixing it needs an aria-label in
  // package-list.tsx, which is app code.
  a11y: knownIssues("aria-progressbar-name"),
};
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  parameters: progressTodo,
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Active")).toBeVisible();
    await expect(canvas.getByText(/59 days left · day 31 of 90/)).toBeVisible();
    await expect(canvas.getByText(pkgs.active.notes!)).toBeVisible();
    await expect(canvas.getByRole("link", { name: "New package" })).toHaveAttribute("href", `/members/${memberId}/packages/new`);
  },
};

/** Ends within the warning window, with part of the price still due. */
export const Expiring: Story = {
  parameters: progressTodo,
  args: { packages: [pkgs.expiring] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Ending soon")).toBeVisible();
    await expect(canvas.getByText(/Due/)).toBeVisible();
  },
};

/** Upcoming hides the progress bar; an open package past its end shows "Ended N days ago". */
export const UpcomingAndExpired: Story = {
  parameters: progressTodo,
  args: { packages: [pkgs.upcoming, pkgs.expired] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Upcoming")).toBeVisible();
    await expect(canvas.getByText(/\+ 7 extra/)).toBeVisible();
    await expect(canvas.getByText(/Ended 31 days ago/)).toBeVisible();
  },
};

/** Closed packages offer "Reopen" instead of complete and cancel. */
export const CompletedAndCancelled: Story = {
  args: { packages: [pkgs.completed, pkgs.cancelled] },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("button", { name: "Reopen" })).toHaveLength(2);
    await expect(canvas.queryByRole("button", { name: "Mark completed" })).toBeNull();
  },
};

/** Without members.packages: no "New package" and no actions. */
export const ReadOnly: Story = {
  parameters: progressTodo,
  args: { packages: Object.values(pkgs), canManage: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("link", { name: "New package" })).toBeNull();
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};

export const Empty: Story = {
  args: { packages: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/No package yet. Create one/)).toBeVisible();
  },
};

export const EmptyReadOnly: Story = {
  args: { packages: [], canManage: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No package yet.")).toBeVisible();
  },
};

export const Cancel: Story = {
  parameters: progressTodo,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Cancel" }));
    const dialog = await screen.findByRole("dialog", { name: "Cancel this package?" });
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel package" }));
    await expect(setPackageStatus).toHaveBeenCalledWith(memberId, pkgs.active.id, "cancelled");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};

export const Complete: Story = {
  parameters: progressTodo,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Mark completed" }));
    const dialog = await screen.findByRole("dialog", { name: "Mark package as completed?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Mark completed" }));
    await expect(setPackageStatus).toHaveBeenCalledWith(memberId, pkgs.active.id, "completed");
  },
};

export const Reopen: Story = {
  args: { packages: [pkgs.completed] },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Reopen" }));
    const dialog = await screen.findByRole("dialog", { name: "Reopen this package?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Reopen" }));
    await expect(setPackageStatus).toHaveBeenCalledWith(memberId, pkgs.completed.id, "active");
  },
};

export const Delete: Story = {
  parameters: progressTodo,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete this package?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    await expect(deletePackage).toHaveBeenCalledWith(memberId, pkgs.active.id);
  },
};
