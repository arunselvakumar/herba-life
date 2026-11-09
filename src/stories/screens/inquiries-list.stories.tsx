import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import InquiriesPage from "@/app/(app)/inquiries/page";
import { listInquiries } from "@/lib/inquiries/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { dueRows, inquiryRows, openRows } from "@/stories/fixtures/inquiries";
import { TODAY } from "@/stories/fixtures/time";
import { frontDeskUser, noRoleUser } from "@/stories/fixtures/users";

const meta = {
  title: "Screens/Inquiries/List",
  component: InquiriesPage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/inquiries" } } },
  decorators: [withAppShell],
  args: { params: Promise.resolve({}), searchParams: Promise.resolve({}) },
  beforeEach: () => {
    mocked(listInquiries).mockResolvedValue(openRows);
  },
} satisfies Meta<typeof InquiriesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("link", { name: "Kavitha Ramesh" })).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Open" })).toHaveAttribute("aria-current", "page");
    await expect(canvas.getByText(`${openRows.length} enquiries`)).toBeVisible();
    await expect(canvas.getByRole("link", { name: "New enquiry" })).toBeVisible();
    await expect(canvas.getByRole("link", { name: /Export/ })).toBeVisible();
    // No filter in the URL: the working list of open enquiries.
    await expect(listInquiries).toHaveBeenCalledWith({ q: undefined, filter: "open", today: TODAY });
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("link", { name: "Kavitha Ramesh" })).toBeVisible();
  },
};

export const FollowUpDue: Story = {
  args: { searchParams: Promise.resolve({ filter: "due" }) },
  beforeEach: () => {
    mocked(listInquiries).mockResolvedValue(dueRows);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("link", { name: "Follow-up due" })).toHaveAttribute("aria-current", "page");
    await expect(await canvas.findByText(/3 days overdue/)).toBeVisible();
    await expect(listInquiries).toHaveBeenCalledWith({ q: undefined, filter: "due", today: TODAY });
  },
};

export const NothingDue: Story = {
  args: { searchParams: Promise.resolve({ filter: "due" }) },
  beforeEach: () => {
    mocked(listInquiries).mockResolvedValue([]);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Nothing due. Nice.")).toBeVisible();
    await expect(canvas.getByText("0 enquiries")).toBeVisible();
  },
};

export const All: Story = {
  args: { searchParams: Promise.resolve({ filter: "all" }) },
  beforeEach: () => {
    mocked(listInquiries).mockResolvedValue(inquiryRows);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("link", { name: "Deepak Nair" })).toBeVisible();
    await expect(canvas.getByRole("link", { name: "All" })).toHaveAttribute("aria-current", "page");
  },
};

export const Search: Story = {
  args: { searchParams: Promise.resolve({ q: "kavitha" }) },
  beforeEach: () => {
    mocked(listInquiries).mockResolvedValue(inquiryRows.filter((r) => r.firstName === "Kavitha"));
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("1 enquiry matching “kavitha”")).toBeVisible();
    await expect(canvas.getByRole("searchbox", { name: "Search enquiries" })).toHaveValue("kavitha");
    // A search with no filter runs across every status.
    await expect(listInquiries).toHaveBeenCalledWith({ q: "kavitha", filter: "all", today: TODAY });
  },
};

export const SearchNoMatch: Story = {
  args: { searchParams: Promise.resolve({ q: "zzz", filter: "lost" }) },
  beforeEach: () => {
    mocked(listInquiries).mockResolvedValue([]);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("No enquiries match that search.")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Record an enquiry" })).toBeVisible();
  },
};

export const FrontDesk: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("link", { name: "Kavitha Ramesh" })).toBeVisible();
    await expect(canvas.getByRole("link", { name: "New enquiry" })).toBeVisible();
    // Front desk can't export.
    await expect(canvas.queryByRole("link", { name: /Export/ })).not.toBeInTheDocument();
  },
};

export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(noRoleUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(listInquiries).not.toHaveBeenCalled();
  },
};
