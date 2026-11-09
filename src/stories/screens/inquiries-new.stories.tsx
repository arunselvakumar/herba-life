import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import NewInquiryPage from "@/app/(app)/inquiries/new/page";
import { createInquiry } from "@/lib/inquiries/actions";
import { listMemberOptions, listStaff } from "@/lib/inquiries/queries";
import { listActivePlans } from "@/lib/packages/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { activePlans, memberOptions, staff } from "@/stories/fixtures/inquiries";
import { TODAY } from "@/stories/fixtures/time";
import { adminUser, frontDeskUser, noRoleUser } from "@/stories/fixtures/users";

const meta = {
  title: "Screens/Inquiries/New",
  component: NewInquiryPage,
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/inquiries/new" } },
  },
  decorators: [withAppShell],
  beforeEach: () => {
    mocked(listActivePlans).mockResolvedValue(activePlans);
    mocked(listStaff).mockResolvedValue(staff);
    mocked(listMemberOptions).mockResolvedValue(memberOptions);
  },
} satisfies Meta<typeof NewInquiryPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "New enquiry" })).toBeVisible();
    await expect(canvas.getByLabelText("Enquired on")).toHaveValue(TODAY);
    // The person recording it is assigned by default.
    await expect(canvas.getByLabelText("Assigned to")).toHaveValue(adminUser.id);
    await expect(canvas.getByRole("button", { name: "Save enquiry" })).toBeVisible();
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "New enquiry" })).toBeVisible();
  },
};

export const Save: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(await canvas.findByLabelText("First name"), "Anjali");
    await userEvent.click(canvas.getByRole("button", { name: "Save enquiry" }));
    await expect(createInquiry).toHaveBeenCalledOnce();
    const formData = mocked(createInquiry).mock.calls[0]![1];
    await expect(formData.get("firstName")).toBe("Anjali");
    await expect(formData.get("assignedTo")).toBe(adminUser.id);
  },
};

export const FrontDesk: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByLabelText("Assigned to")).toHaveValue(frontDeskUser.id);
  },
};

export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(noRoleUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(listStaff).not.toHaveBeenCalled();
  },
};
