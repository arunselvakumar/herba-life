import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import ConvertInquiryPage from "@/app/(app)/inquiries/[id]/convert/page";
import { convertInquiry } from "@/lib/inquiries/actions";
import { getInquiry } from "@/lib/inquiries/queries";
import { listActivePlans } from "@/lib/packages/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { activePlans, bareInquiry, convertOnlyUser, openInquiry } from "@/stories/fixtures/inquiries";
import { TODAY } from "@/stories/fixtures/time";
import { frontDeskUser } from "@/stories/fixtures/users";

const meta = {
  title: "Screens/Inquiries/Convert",
  component: ConvertInquiryPage,
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: `/inquiries/${openInquiry.id}/convert` } },
  },
  decorators: [withAppShell],
  args: { params: Promise.resolve({ id: openInquiry.id }), searchParams: Promise.resolve({}) },
  beforeEach: () => {
    mocked(getInquiry).mockResolvedValue(openInquiry);
    mocked(listActivePlans).mockResolvedValue(activePlans);
  },
} satisfies Meta<typeof ConvertInquiryPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "Enrol Kavitha Ramesh" })).toBeVisible();
    await expect(canvas.getByText("Converting enquiry #214")).toBeVisible();
    await expect(canvas.getByText(/The 3 months package is pre-selected/)).toBeVisible();
    // The enquiry's details carry over to the member form.
    await expect(canvas.getByLabelText("First name")).toHaveValue("Kavitha");
    await expect(canvas.getByRole("button", { name: "Create member" })).toBeVisible();
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "Enrol Kavitha Ramesh" })).toBeVisible();
  },
};

export const NoPackageChosen: Story = {
  args: { params: Promise.resolve({ id: bareInquiry.id }) },
  beforeEach: () => {
    mocked(getInquiry).mockResolvedValue(bareInquiry);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "Enrol Vignesh" })).toBeVisible();
    await expect(canvas.queryByText(/package is pre-selected/)).not.toBeInTheDocument();
  },
};

export const CreateMember: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Create member" }));
    await expect(convertInquiry).toHaveBeenCalledWith(openInquiry.id, expect.anything(), expect.any(FormData));
    const formData = mocked(convertInquiry).mock.calls[0]![2];
    await expect(formData.get("firstName")).toBe("Kavitha");
    await expect(formData.get("joinedOn")).toBe(TODAY);
  },
};

export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(canvas.getByText(/Convert to member/)).toBeVisible();
  },
};

export const CannotCreateMembers: Story = {
  beforeEach: () => {
    // Allowed to convert, but converting creates a member: that permission is named.
    mocked(getCurrentUser).mockResolvedValue(convertOnlyUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(canvas.getByText(/Create a member/)).toBeVisible();
    await expect(getInquiry).not.toHaveBeenCalled();
  },
};
