import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { NoAccess } from "@/components/app/no-access";
import { frame } from "@/stories/decorators";

const meta = {
  title: "App/NoAccess",
  component: NoAccess,
  parameters: { layout: "padded" },
  decorators: [frame("lg")],
  args: { permission: "members.view" },
} satisfies Meta<typeof NoAccess>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Names the missing permission in words, so the person knows what to ask for. */
export const Members: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/View members/)).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Back to the overview" })).toHaveAttribute("href", "/");
  },
};

export const Stock: Story = {
  args: { permission: "stock.sell" },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Sell products/)).toBeVisible();
  },
};

export const Team: Story = { args: { permission: "users.view" } };
