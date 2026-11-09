import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen, waitFor, within } from "storybook/test";
import { CheckinHistory } from "@/components/members/checkin-history";
import { deleteCheckin } from "@/lib/members/actions";
import { makeCheckin, memberWithEverything, newMember } from "@/stories/fixtures/members";
import { adminUser } from "@/stories/fixtures/users";
import { daysFromToday } from "@/stories/fixtures/time";

const meta = {
  title: "Members/CheckinHistory",
  component: CheckinHistory,
  tags: ["autodocs"],
  args: { member: memberWithEverything, canDelete: true },
} satisfies Meta<typeof CheckinHistory>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Newest first; weight, fat and waist show the change since the visit before. */
export const SeveralCheckins: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("3 visits recorded")).toBeVisible();
    // 72.0 → 70.2 → 68.4 kg: down 1.8 kg at each visit; the first visit has nothing to compare.
    await expect(canvas.getAllByText("-1.8")).toHaveLength(2);
    await expect(canvas.getAllByRole("button", { name: "Delete" })).toHaveLength(3);
  },
};

export const WithRemarks: Story = {
  args: {
    member: {
      ...memberWithEverything,
      checkins: memberWithEverything.checkins.map((c, i) =>
        i === 0 ? { ...c, remarks: "Skipped the evening shake twice this week; knee pain is better after the stretches." } : c,
      ),
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/knee pain is better/)).toBeVisible();
  },
};

export const OneCheckin: Story = {
  args: {
    member: {
      ...newMember,
      checkins: [{ ...makeCheckin({ memberId: newMember.id, recordedOn: daysFromToday(-3) }), recordedByUser: { name: adminUser.name } }],
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("1 visit recorded")).toBeVisible();
    await expect(canvas.queryByText(/^[+-]\d/)).toBeNull();
  },
};

/** Without members.followups: no delete buttons. */
export const ReadOnly: Story = {
  args: { canDelete: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button", { name: "Delete" })).toBeNull();
  },
};

export const Empty: Story = {
  args: { member: newMember },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No visits recorded yet.")).toBeVisible();
    await expect(canvas.getByText("Use the form above to record the first visit.")).toBeVisible();
  },
};

export const EmptyReadOnly: Story = {
  args: { member: newMember, canDelete: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No visits have been recorded for this member.")).toBeVisible();
  },
};

/** Deleting asks first, then calls `deleteCheckin(memberId, checkinId)`. */
export const Delete: Story = {
  play: async ({ canvas, userEvent }) => {
    const [first] = canvas.getAllByRole("button", { name: "Delete" });
    await userEvent.click(first!);
    const dialog = await screen.findByRole("dialog", { name: "Delete this follow-up?" });
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    const latest = memberWithEverything.checkins[0]!;
    await expect(deleteCheckin).toHaveBeenCalledWith(memberWithEverything.id, latest.id);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};
