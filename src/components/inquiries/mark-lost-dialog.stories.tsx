import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor, within } from "storybook/test";
import { MarkLostDialog } from "@/components/inquiries/mark-lost-dialog";
import { markLost } from "@/lib/inquiries/actions";
import { openInquiry } from "@/stories/fixtures/inquiries";

const meta = {
  title: "Inquiries/MarkLostDialog",
  component: MarkLostDialog,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  // The page binds the inquiry id, exactly as here.
  args: { action: markLost.bind(null, openInquiry.id), name: "Kavitha Ramesh" },
} satisfies Meta<typeof MarkLostDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = within(document.body);

export const Closed: Story = {};

export const Open: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Mark lost" }));
    const dialog = await body.findByRole("dialog", { name: "Mark Kavitha Ramesh as lost?" });
    await expect(within(dialog).getByLabelText("Reason")).toHaveFocus();
  },
};

export const SubmitReason: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Mark lost" }));
    const dialog = await body.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Reason"), "Too expensive for now");
    await userEvent.click(within(dialog).getByRole("button", { name: "Mark lost" }));

    await expect(markLost).toHaveBeenCalledOnce();
    const [inquiryId, , formData] = mocked(markLost).mock.calls[0]!;
    await expect(inquiryId).toBe(openInquiry.id);
    await expect(formData.get("lostReason")).toBe("Too expensive for now");
    // Success closes the dialog; the page then re-renders as lost.
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

export const ReasonRequired: Story = {
  beforeEach: () => {
    mocked(markLost).mockResolvedValue({ status: "error", errors: { lostReason: ["Say why, briefly, so the next person knows"] } });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Mark lost" }));
    const dialog = await body.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Mark lost" }));

    await expect(markLost).toHaveBeenCalled();
    await expect(await within(dialog).findByRole("alert")).toHaveTextContent("Say why, briefly, so the next person knows");
    // An error keeps the dialog open.
    await expect(dialog).toHaveAttribute("data-state", "open");
  },
};

export const AlreadyClosed: Story = {
  beforeEach: () => {
    mocked(markLost).mockResolvedValue({ status: "error", message: "This enquiry is closed. Reopen it to make changes.", errors: {} });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Mark lost" }));
    const dialog = await body.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Reason"), "Not reachable");
    await userEvent.click(within(dialog).getByRole("button", { name: "Mark lost" }));

    await expect(await within(dialog).findByText("This enquiry is closed. Reopen it to make changes.")).toBeVisible();
  },
};
