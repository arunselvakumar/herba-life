import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor, within } from "storybook/test";
import { VoidSaleDialog } from "@/components/stock/void-sale-dialog";
import { voidSale } from "@/lib/stock/actions"; // the mock, not the server action
import { onSurface } from "@/stories/decorators";
import { saleToday } from "@/stories/fixtures/stock";

const meta = {
  title: "Stock/VoidSaleDialog",
  component: VoidSaleDialog,
  tags: ["autodocs"],
  decorators: [onSurface],
  args: { saleId: saleToday.id, serialNo: saleToday.serialNo },
} satisfies Meta<typeof VoidSaleDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Void sale" }));
    // Dialogs render in a portal: query the whole document.
    const dialog = await within(document.body).findByRole("dialog", { name: `Void sale #${saleToday.serialNo}?` });
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(within(dialog).getByLabelText("Reason")).toHaveFocus();
  },
};

export const Confirm: Story = {
  beforeEach: () => {
    mocked(voidSale).mockResolvedValue({ status: "success", message: "Sale voided and stock returned to the shelf." });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Void sale" }));
    const dialog = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.type(within(dialog).getByLabelText("Reason"), "Customer returned it unopened");
    await userEvent.click(within(dialog).getByRole("button", { name: "Void sale" }));

    await expect(await within(dialog).findByText("Sale voided and stock returned to the shelf.")).toBeVisible();
    const [saleId, , formData] = mocked(voidSale).mock.calls[0] ?? [];
    await expect(saleId).toBe(saleToday.id);
    await expect(formData?.get("reason")).toBe("Customer returned it unopened");
    // It closes itself shortly after saving.
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).not.toBeInTheDocument());
  },
};

export const ReasonMissing: Story = {
  beforeEach: () => {
    mocked(voidSale).mockResolvedValue({ status: "error", errors: { reason: ["Say why the sale is being voided."] } });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Void sale" }));
    const dialog = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.click(within(dialog).getByRole("button", { name: "Void sale" }));
    await expect(await within(dialog).findByText("Say why the sale is being voided.")).toBeVisible();
    await expect(voidSale).toHaveBeenCalledTimes(1);
    await expect(within(dialog).getByRole("heading", { name: /Void sale/ })).toBeVisible();
  },
};

export const AlreadyVoided: Story = {
  beforeEach: () => {
    mocked(voidSale).mockResolvedValue({ status: "error", message: "This sale was already voided.", errors: {} });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Void sale" }));
    const dialog = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.type(within(dialog).getByLabelText("Reason"), "Entered twice");
    await userEvent.click(within(dialog).getByRole("button", { name: "Void sale" }));
    await expect(await within(dialog).findByText("This sale was already voided.")).toBeVisible();
    // A failed void keeps what was typed.
    await expect(within(dialog).getByLabelText("Reason")).toHaveValue("Entered twice");
  },
};
