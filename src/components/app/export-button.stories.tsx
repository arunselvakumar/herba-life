import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { ExportButton } from "@/components/app/export-button";
import { EVERYTHING_KEY } from "@/lib/export/catalog";

const meta = {
  title: "App/ExportButton",
  component: ExportButton,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { module: "members" },
} satisfies Meta<typeof ExportButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One module's workbook, as on a list page's header. */
export const SingleModule: Story = {
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "Export" });
    await expect(link).toHaveAttribute("href", "/api/export/members");
    await expect(link).toHaveAttribute("download");
  },
};

/** Scoped to one record, for example a member's own history. */
export const WithParams: Story = {
  args: { params: { member: "1a2b3c4d-0000-4000-8000-000000000001" }, label: "Export history" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Export history" })).toHaveAttribute(
      "href",
      "/api/export/members?member=1a2b3c4d-0000-4000-8000-000000000001",
    );
  },
};

/** Every workbook the role may export, in one file. */
export const Everything: Story = {
  args: { module: EVERYTHING_KEY, label: "Download everything", variant: "default" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Download everything" })).toHaveAttribute("href", "/api/export/everything");
  },
};

export const Small: Story = {
  args: { module: "stock", label: "Download stock", size: "sm" },
};
