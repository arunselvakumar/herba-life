import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";
import { ActivityList } from "@/components/inquiries/activity-list";
import { deleteActivity } from "@/lib/inquiries/actions";
import { frame } from "@/stories/decorators";
import { activities, openInquiry } from "@/stories/fixtures/inquiries";

// The log brings its own card, so it sits straight on the page canvas.
const meta = {
  title: "Inquiries/ActivityList",
  component: ActivityList,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [frame("lg")],
  args: { inquiryId: openInquiry.id, activities, canDelete: true },
} satisfies Meta<typeof ActivityList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EveryActivityKind: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("5 entries, newest first")).toBeVisible();
    for (const label of ["Phone call", "WhatsApp", "Visit", "Note", "Status"]) {
      await expect(canvas.getByText(label)).toBeVisible();
    }
    // Staff entries can be deleted; the system's status entry can't.
    await expect(canvas.getAllByRole("button", { name: "Delete entry" })).toHaveLength(4);
  },
};

export const ReadOnly: Story = {
  args: { canDelete: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button", { name: "Delete entry" })).not.toBeInTheDocument();
  },
};

export const SingleEntry: Story = {
  args: { activities: activities.slice(0, 1) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("1 entry, newest first")).toBeVisible();
  },
};

export const Empty: Story = {
  args: { activities: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Nothing logged yet.")).toBeVisible();
    await expect(canvas.getByText("Log the first call or visit above.")).toBeVisible();
  },
};

export const EmptyReadOnly: Story = {
  args: { activities: [], canDelete: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No follow-ups have been logged.")).toBeVisible();
  },
};

export const Delete: Story = {
  play: async ({ canvas, userEvent }) => {
    const [first] = canvas.getAllByRole("button", { name: "Delete entry" });
    await userEvent.click(first!);
    // The confirmation renders in a portal.
    const dialog = await within(document.body).findByRole("dialog", { name: "Delete this entry?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    await expect(deleteActivity).toHaveBeenCalledWith(openInquiry.id, activities[0]!.id);
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).not.toBeInTheDocument());
  },
};
