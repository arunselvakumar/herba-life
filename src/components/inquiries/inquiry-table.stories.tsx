import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { InquiryTable } from "@/components/inquiries/inquiry-table";
import { frame } from "@/stories/decorators";
import { dueRows, inquiryRows } from "@/stories/fixtures/inquiries";
import { TODAY } from "@/stories/fixtures/time";

// The table brings its own card, so it sits straight on the page canvas.
const meta = {
  title: "Inquiries/InquiryTable",
  component: InquiryTable,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [frame("xl")],
  args: {
    inquiries: inquiryRows,
    today: TODAY,
    emptyMessage: "No enquiries in this group.",
    canCreate: true,
  },
} satisfies Meta<typeof InquiryTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MixedStatuses: Story = {
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table");
    // A header row plus one row per enquiry.
    await expect(within(table).getAllByRole("row")).toHaveLength(inquiryRows.length + 1);
    await expect(canvas.getByRole("link", { name: "Kavitha Ramesh" })).toHaveAttribute(
      "href",
      "/inquiries/5e6f7a8b-0000-4000-8000-0000000000a1",
    );
    for (const status of ["New", "In progress", "Converted", "Lost"]) {
      await expect(canvas.getAllByText(status).length).toBeGreaterThan(0);
    }
    // No mobile, so the email stands in; neither, and the row says so.
    await expect(canvas.getByText("divya.k@example.com")).toBeInTheDocument();
  },
};

export const OverdueFollowUps: Story = {
  args: { inquiries: dueRows, emptyMessage: "Nothing due. Nice." },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/3 days overdue/)).toBeInTheDocument();
    await expect(canvas.getByText(/1 day overdue/)).toBeInTheDocument();
    await expect(canvas.getByText(/Today/)).toBeInTheDocument();
    await expect(canvas.queryByText("Converted")).not.toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: { inquiries: [], emptyMessage: "No enquiries yet." },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No enquiries yet.")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Record an enquiry" })).toHaveAttribute("href", "/inquiries/new");
  },
};

export const EmptyReadOnly: Story = {
  args: { inquiries: [], emptyMessage: "Nothing due. Nice.", canCreate: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Nothing due. Nice.")).toBeVisible();
    await expect(canvas.queryByRole("link", { name: "Record an enquiry" })).not.toBeInTheDocument();
  },
};
