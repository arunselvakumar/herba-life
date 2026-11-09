import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen, waitFor, within } from "storybook/test";
import { PlanTable } from "@/components/packages/plan-table";
import { deletePlan, setPlanActive } from "@/lib/packages/actions";
import { onSurface } from "@/stories/decorators";
import { planRows } from "@/stories/fixtures/members";

const [oneMonth, , sixMonths, trialWeek] = planRows;

const meta = {
  title: "Packages/PlanTable",
  component: PlanTable,
  tags: ["autodocs"],
  decorators: [onSurface],
  args: { plans: planRows, canCreate: true, canUpdate: true, canDelete: true },
} satisfies Meta<typeof PlanTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Edit and archive on every row; delete only on packages nobody was enrolled in. */
export const FullAccess: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: `Edit ${oneMonth!.name}` })).toHaveAttribute("href", `/packages/${oneMonth!.id}/edit`);
    await expect(canvas.getAllByRole("button", { name: "Archive" })).toHaveLength(3);
    await expect(canvas.getAllByRole("button", { name: "Restore" })).toHaveLength(1);
    await expect(canvas.getAllByRole("button", { name: "Delete" })).toHaveLength(1);
    await expect(canvas.getByText("Archived")).toBeVisible();
  },
};

/** Without packages.update or packages.delete: no actions column. */
export const ReadOnly: Story = {
  args: { canCreate: false, canUpdate: false, canDelete: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("columnheader", { name: "Actions" })).toBeNull();
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};

/** Can delete but not update: only the delete button, on the unsold package. */
export const DeleteOnly: Story = {
  args: { canUpdate: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("link", { name: /^Edit / })).toBeNull();
    await expect(canvas.getAllByRole("button", { name: "Delete" })).toHaveLength(1);
  },
};

export const Empty: Story = {
  args: { plans: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No packages yet")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Create the first package" })).toHaveAttribute("href", "/packages/new");
  },
};

export const EmptyReadOnly: Story = {
  args: { plans: [], canCreate: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("link", { name: "Create the first package" })).toBeNull();
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("columnheader", { name: "Members" })).toBeNull();
  },
};

export const Delete: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog", { name: `Delete ${sixMonths!.name}?` });
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    await expect(deletePlan).toHaveBeenCalledWith(sixMonths!.id);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};

export const Archive: Story = {
  play: async ({ canvas, userEvent }) => {
    const [first] = canvas.getAllByRole("button", { name: "Archive" });
    await userEvent.click(first!);
    const dialog = await screen.findByRole("dialog", { name: `Archive ${oneMonth!.name}?` });
    await userEvent.click(within(dialog).getByRole("button", { name: "Archive" }));
    await expect(setPlanActive).toHaveBeenCalledWith(oneMonth!.id, false);
  },
};

export const Restore: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Restore" }));
    const dialog = await screen.findByRole("dialog", { name: `Make ${trialWeek!.name} available again?` });
    await userEvent.click(within(dialog).getByRole("button", { name: "Restore" }));
    await expect(setPlanActive).toHaveBeenCalledWith(trialWeek!.id, true);
  },
};
