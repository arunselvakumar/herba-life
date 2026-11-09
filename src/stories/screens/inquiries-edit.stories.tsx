import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import EditInquiryPage from "@/app/(app)/inquiries/[id]/edit/page";
import { updateInquiry } from "@/lib/inquiries/actions";
import { getInquiry, listMemberOptions, listStaff } from "@/lib/inquiries/queries";
import { getPlan, listActivePlans } from "@/lib/packages/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { activePlans, archivedPlan, archivedPlanInquiry, memberOptions, openInquiry, staff } from "@/stories/fixtures/inquiries";
import { frontDeskUser } from "@/stories/fixtures/users";

const meta = {
  title: "Screens/Inquiries/Edit",
  component: EditInquiryPage,
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: `/inquiries/${openInquiry.id}/edit` } },
  },
  decorators: [withAppShell],
  args: { params: Promise.resolve({ id: openInquiry.id }), searchParams: Promise.resolve({}) },
  beforeEach: () => {
    mocked(getInquiry).mockResolvedValue(openInquiry);
    // A fresh copy: the page appends an archived plan to the list it gets.
    mocked(listActivePlans).mockResolvedValue([...activePlans]);
    mocked(listStaff).mockResolvedValue(staff);
    mocked(listMemberOptions).mockResolvedValue(memberOptions);
    mocked(getPlan).mockResolvedValue(archivedPlan);
  },
} satisfies Meta<typeof EditInquiryPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "Edit Kavitha Ramesh" })).toBeVisible();
    await expect(canvas.getByLabelText("First name")).toHaveValue("Kavitha");
    await expect(canvas.getByLabelText("Source")).toHaveValue("referral");
    await expect(canvas.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", `/inquiries/${openInquiry.id}`);
    await expect(getPlan).not.toHaveBeenCalled();
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "Edit Kavitha Ramesh" })).toBeVisible();
  },
};

export const SaveChanges: Story = {
  play: async ({ canvas, userEvent }) => {
    const mobile = await canvas.findByLabelText("Mobile");
    await userEvent.clear(mobile);
    await userEvent.type(mobile, "98400 99999");
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
    await expect(updateInquiry).toHaveBeenCalledWith(openInquiry.id, expect.anything(), expect.any(FormData));
    const formData = mocked(updateInquiry).mock.calls[0]![2];
    await expect(formData.get("mobile")).toBe("98400 99999");
  },
};

export const ArchivedPackage: Story = {
  args: { params: Promise.resolve({ id: archivedPlanInquiry.id }) },
  beforeEach: () => {
    mocked(getInquiry).mockResolvedValue(archivedPlanInquiry);
  },
  play: async ({ canvas }) => {
    // The archived plan stays selectable on the enquiry that already has it.
    await expect(await canvas.findByLabelText("Interested package")).toHaveValue(archivedPlan.id);
    await expect(getPlan).toHaveBeenCalledWith(archivedPlan.id);
  },
};

export const NoAccess: Story = {
  beforeEach: () => {
    // Front desk can create enquiries but not edit them.
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(canvas.getByText(/Update an enquiry/)).toBeVisible();
    await expect(getInquiry).not.toHaveBeenCalled();
  },
};
