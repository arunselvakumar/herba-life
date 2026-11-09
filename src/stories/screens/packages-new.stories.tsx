import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor } from "storybook/test";
import NewPackagePage from "@/app/(app)/packages/new/page";
import { createPlan } from "@/lib/packages/actions";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { frontDeskUser } from "@/stories/fixtures/users";

const meta = {
  title: "Screens/Packages/New",
  component: NewPackagePage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/packages/new" } } },
  decorators: [withAppShell],
} satisfies Meta<typeof NewPackagePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "New package" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Create package" })).toBeVisible();
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "New package" })).toBeVisible();
  },
};

export const Create: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(await canvas.findByLabelText("Name"), "12 months");
    await userEvent.type(canvas.getByLabelText("Duration"), "365");
    await userEvent.click(canvas.getByRole("button", { name: "Create package" }));
    await waitFor(() => expect(createPlan).toHaveBeenCalledOnce());
    const data = mocked(createPlan).mock.calls[0]?.[1];
    await expect(data instanceof FormData && data.get("name")).toBe("12 months");
  },
};

export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
  },
};
