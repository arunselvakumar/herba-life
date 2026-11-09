import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor, within } from "storybook/test";
import { AdjustStockDialog } from "@/components/stock/adjust-stock-dialog";
import { adjustStock } from "@/lib/stock/actions"; // the mock, not the server action
import { onSurface } from "@/stories/decorators";
import { vanilla } from "@/stories/fixtures/stock";
import { TODAY } from "@/stories/fixtures/time";

const meta = {
  title: "Stock/AdjustStockDialog",
  component: AdjustStockDialog,
  tags: ["autodocs"],
  decorators: [onSurface],
  args: { productId: vanilla.id, productName: vanilla.name, onHand: vanilla.onHand, today: TODAY },
} satisfies Meta<typeof AdjustStockDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Adjust" }));
    // Dialogs render in a portal: query the whole document.
    const dialog = await within(document.body).findByRole("dialog", { name: `Adjust ${vanilla.name}` });
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(within(dialog).getByText(/14 on hand now/)).toBeVisible();
    await expect(within(dialog).getByLabelText("Change")).toHaveValue("remove");
    await expect(within(dialog).getByLabelText("On")).toHaveValue(TODAY);
  },
};

export const Saved: Story = {
  beforeEach: () => {
    mocked(adjustStock).mockResolvedValue({ status: "success", message: `${vanilla.name} is now at 13.` });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Adjust" }));
    const dialog = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.type(within(dialog).getByLabelText("Quantity"), "1");
    await userEvent.type(within(dialog).getByLabelText("Reason"), "Sample given out");
    await userEvent.click(within(dialog).getByRole("button", { name: "Save adjustment" }));

    await expect(await within(dialog).findByText(`${vanilla.name} is now at 13.`)).toBeVisible();
    const formData = mocked(adjustStock).mock.calls[0]?.[1];
    await expect(formData?.get("productId")).toBe(vanilla.id);
    await expect(formData?.get("direction")).toBe("remove");
    await expect(formData?.get("quantity")).toBe("1");
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).not.toBeInTheDocument());
  },
};

/** Removing more than is on the shelf: the server refuses and the dialog keeps what was typed. */
export const BelowZeroRejected: Story = {
  beforeEach: () => {
    mocked(adjustStock).mockResolvedValue({ status: "error", errors: { quantity: ["Only 14 on hand; you cannot remove 20."] } });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Adjust" }));
    const dialog = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.selectOptions(within(dialog).getByLabelText("Change"), "remove");
    await userEvent.type(within(dialog).getByLabelText("Quantity"), "20");
    await userEvent.type(within(dialog).getByLabelText("Reason"), "Count was off");
    await userEvent.click(within(dialog).getByRole("button", { name: "Save adjustment" }));

    await expect(await within(dialog).findByText("Only 14 on hand; you cannot remove 20.")).toBeVisible();
    await expect(adjustStock).toHaveBeenCalledTimes(1);
    await expect(mocked(adjustStock).mock.calls[0]?.[1].get("quantity")).toBe("20");
    // Still open, with the values kept for a correction.
    await expect(within(dialog).getByLabelText("Quantity")).toHaveValue(20);
    await expect(within(dialog).getByLabelText("Reason")).toHaveValue("Count was off");
  },
};

/** A changed "Change" select survives the form reset after an error, like the typed fields. */
export const DirectionKeptAfterError: Story = {
  beforeEach: () => {
    mocked(adjustStock).mockResolvedValue({ status: "error", errors: { reason: ["Say why the count changed."] } });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Adjust" }));
    const dialog = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.selectOptions(within(dialog).getByLabelText("Change"), "add");
    await userEvent.type(within(dialog).getByLabelText("Quantity"), "2");
    await userEvent.click(within(dialog).getByRole("button", { name: "Save adjustment" }));

    await expect(await within(dialog).findByText("Say why the count changed.")).toBeVisible();
    await expect(within(dialog).getByLabelText("Change")).toHaveValue("add");
    await userEvent.type(within(dialog).getByLabelText("Reason"), "Found two in the back");
    await userEvent.click(within(dialog).getByRole("button", { name: "Save adjustment" }));
    await waitFor(() => expect(adjustStock).toHaveBeenCalledTimes(2));
    await expect(mocked(adjustStock).mock.calls[1]?.[1].get("direction")).toBe("add");
  },
};
