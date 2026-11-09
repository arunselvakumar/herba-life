import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor, within } from "storybook/test";
import InquiryPage from "@/app/(app)/inquiries/[id]/page";
import { markLost } from "@/lib/inquiries/actions";
import { findMembersByMobile, getInquiry } from "@/lib/inquiries/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { bareInquiry, convertedInquiry, lostInquiry, openInquiry, possibleMatches } from "@/stories/fixtures/inquiries";
import { frontDeskUser, noRoleUser } from "@/stories/fixtures/users";
import { knownIssues } from "@/stories/a11y";

const meta = {
  title: "Screens/Inquiries/Detail",
  component: InquiryPage,
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: `/inquiries/${openInquiry.id}` } },
    // Known issue: the page's ContactCard wraps its phone/email links and
    // address paragraphs in <dl><div>…</div></dl> with no <dt>/<dd>, which
    // fails axe's definition-list rule (WCAG 1.3.1). The fix is in
    // src/app/(app)/inquiries/[id]/page.tsx (drop the <dl> or use dt/dd).
    a11y: knownIssues("definition-list", "dlitem"),
  },
  decorators: [withAppShell],
  args: { params: Promise.resolve({ id: openInquiry.id }), searchParams: Promise.resolve({}) },
  beforeEach: () => {
    mocked(getInquiry).mockResolvedValue(openInquiry);
    mocked(findMembersByMobile).mockResolvedValue([]);
  },
} satisfies Meta<typeof InquiryPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: /Kavitha Ramesh/ })).toBeVisible();
    await expect(canvas.getByText("Enquiry #214")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Convert to member" })).toHaveAttribute("href", `/inquiries/${openInquiry.id}/convert`);
    await expect(canvas.getByRole("link", { name: "Edit" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Mark lost" })).toBeVisible();
    await expect(canvas.getByText("Log a follow-up")).toBeVisible();
    await expect(canvas.getByText("5 entries, newest first")).toBeVisible();
    await expect(getInquiry).toHaveBeenCalledWith(openInquiry.id);
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: /Kavitha Ramesh/ })).toBeVisible();
    await expect(canvas.getByText("Follow-up log")).toBeInTheDocument();
  },
};

export const PossibleExistingMember: Story = {
  beforeEach: () => {
    mocked(findMembersByMobile).mockResolvedValue(possibleMatches);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Possibly an existing member")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "#101 Priya Sharma" })).toBeVisible();
    await expect(findMembersByMobile).toHaveBeenCalledWith(openInquiry.mobile);
  },
};

export const JustRecorded: Story = {
  args: { params: Promise.resolve({ id: bareInquiry.id }) },
  beforeEach: () => {
    mocked(getInquiry).mockResolvedValue(bareInquiry);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: /Vignesh/ })).toBeVisible();
    await expect(canvas.getByText("Nothing logged yet.")).toBeVisible();
    await expect(canvas.getByText("No readings taken.")).toBeVisible();
    await expect(canvas.getByText("Unassigned")).toBeVisible();
  },
};

export const MarkLost: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Mark lost" }));
    const dialog = await within(document.body).findByRole("dialog", { name: "Mark Kavitha Ramesh as lost?" });
    await userEvent.type(within(dialog).getByLabelText("Reason"), "Joined elsewhere");
    await userEvent.click(within(dialog).getByRole("button", { name: "Mark lost" }));

    await expect(markLost).toHaveBeenCalledWith(openInquiry.id, expect.anything(), expect.any(FormData));
    // Success closes the dialog (it may linger a moment while it animates out).
    await waitFor(() => expect(dialog).toHaveAttribute("data-state", "closed"));
  },
};

export const Converted: Story = {
  args: { params: Promise.resolve({ id: convertedInquiry.id }) },
  beforeEach: () => {
    mocked(getInquiry).mockResolvedValue(convertedInquiry);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/Converted to a member on/)).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Open member #102 · Rahul Iyer" })).toHaveAttribute(
      "href",
      `/members/${convertedInquiry.convertedMemberId}`,
    );
    // Closed: no reminders, no logging, no convert or edit.
    await expect(canvas.getByText("Closed enquiries have no reminders.")).toBeVisible();
    await expect(canvas.queryByText("Log a follow-up")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("link", { name: "Convert to member" })).not.toBeInTheDocument();
    await expect(findMembersByMobile).not.toHaveBeenCalled();
  },
};

export const ConvertedMemberDeleted: Story = {
  args: { params: Promise.resolve({ id: convertedInquiry.id }) },
  beforeEach: () => {
    mocked(getInquiry).mockResolvedValue({ ...convertedInquiry, convertedMember: null, convertedMemberId: null });
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("The member record has since been deleted.")).toBeVisible();
  },
};

export const Lost: Story = {
  args: { params: Promise.resolve({ id: lostInquiry.id }) },
  beforeEach: () => {
    mocked(getInquiry).mockResolvedValue(lostInquiry);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/Marked lost on/)).toBeVisible();
    await expect(canvas.getByText(lostInquiry.lostReason!)).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Reopen" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Mark lost" })).not.toBeInTheDocument();
  },
};

export const FrontDesk: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas }) => {
    // Front desk logs follow-ups but can't edit, convert, mark lost or delete.
    await expect(await canvas.findByText("Log a follow-up")).toBeVisible();
    await expect(canvas.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("link", { name: "Convert to member" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  },
};

export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(noRoleUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(getInquiry).not.toHaveBeenCalled();
  },
};
