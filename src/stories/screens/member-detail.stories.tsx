import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, screen, waitFor, within } from "storybook/test";
import MemberPage from "@/app/(app)/members/[id]/page";
import type { Attendance } from "@/db/schema";
import type { MemberCalendar } from "@/lib/attendance/calendar";
import { getMemberCalendar } from "@/lib/attendance/calendar";
import { getSourceInquiry } from "@/lib/inquiries/queries";
import type { Permission } from "@/lib/access/permissions";
import { deleteMember } from "@/lib/members/actions";
import { getMember } from "@/lib/members/queries";
import { getCurrentUser } from "@/lib/session";
import { listMemberSales, type SaleListRow } from "@/lib/stock/queries";
import { withAppShell } from "@/stories/decorators";
import { memberWithEverything, memberWithHealth, newMember } from "@/stories/fixtures/members";
import { at, daysFromToday } from "@/stories/fixtures/time";
import { adminUser, frontDeskUser, noRoleUser } from "@/stories/fixtures/users";
import { fullCheck, knownIssues } from "@/stories/a11y";

const member = memberWithEverything;

// Minimal attendance and stock data, inline until those modules' fixtures land.
const lastVisit = {
  id: "5e6f7081-0000-4000-8000-000000000001",
  memberId: member.id,
  checkedInAt: at(-1, 8, 42),
  day: daysFromToday(-1),
  period: "morning",
  source: "kiosk",
  note: null,
  recordedBy: adminUser.id,
  createdAt: at(-1, 8, 42),
} satisfies Attendance;

const visit = (n: number, time: string) => ({
  id: `5e6f7081-0000-4000-8000-0000000001${String(n).padStart(2, "0")}`,
  time,
  period: "morning" as const,
  source: "kiosk" as const,
  note: null,
  recordedBy: null,
});

const calendar = {
  months: [
    { month: "2026-10", visits: 3, days: { 6: [visit(1, "8:30 am")], 14: [visit(2, "8:45 am")], 27: [visit(3, "9:02 am")] } },
    { month: "2026-11", visits: 2, days: { 2: [visit(4, "8:40 am")], 8: [visit(5, "8:42 am")] } },
  ],
  hasMore: false,
  total: 5,
  thisMonth: 2,
  last: lastVisit,
} satisfies MemberCalendar;

const noVisits = { months: [{ month: "2026-11", visits: 0, days: {} }], hasMore: false, total: 0, thisMonth: 0, last: null } satisfies MemberCalendar;

const sales = [
  {
    id: "6f708192-0000-4000-8000-000000000001",
    serialNo: 318,
    memberId: member.id,
    buyerName: "Priya Sharma",
    soldOn: daysFromToday(-5),
    priceLevel: "mrp",
    total: 2450,
    amountPaid: 1450,
    paymentMode: "upi",
    notes: null,
    voidedAt: null,
    voidReason: null,
    voidedBy: null,
    soldBy: adminUser.id,
    createdAt: at(-5, 11),
    updatedAt: at(-5, 11),
    items: [
      { id: "708192a3-0000-4000-8000-000000000001", name: "Formula 1 Shake, Kulfi", quantity: 1 },
      { id: "708192a3-0000-4000-8000-000000000002", name: "Afresh, Lemon", quantity: 1 },
    ],
    member: { id: member.id, serialNo: member.serialNo, firstName: member.firstName, lastName: member.lastName },
    soldByUser: { name: adminUser.name },
  },
] satisfies SaleListRow[];

/** Views members and sees attendance and stock, but changes nothing on the profile. */
const viewerUser = {
  ...frontDeskUser,
  id: "0b5a8c1e-7e1f-4f53-9a43-3c2f7f0a0009",
  name: "Viewer",
  permissions: ["members.view", "attendance.view", "stock.view"] satisfies Permission[],
};

const meta = {
  title: "Screens/Members/Detail",
  component: MemberPage,
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: `/members/${member.id}` } },
    // Known issues, all in app code outside this story:
    // - PackageList: the open package's <Progress> (role="progressbar") has no accessible
    //   name (aria-progressbar-name).
    // - members/[id]/page.tsx ContactCard: the <dl> wraps the contact links in a plain <div>
    //   and nests the dt/dd rows inside another <div> (definition-list, dlitem).
    // - MemberCalendar (attendance): days after today render #cbcbca on white, 1.62:1
    //   (color-contrast). Each needs a markup or design change in those components.
    a11y: knownIssues("aria-progressbar-name", "definition-list", "dlitem", "color-contrast"),
  },
  decorators: [withAppShell],
  args: { params: Promise.resolve({ id: member.id }), searchParams: Promise.resolve({}) },
  beforeEach: () => {
    mocked(getMember).mockResolvedValue(member);
    mocked(getSourceInquiry).mockResolvedValue(null);
    mocked(getMemberCalendar).mockResolvedValue(calendar);
    mocked(listMemberSales).mockResolvedValue(sales);
  },
} satisfies Meta<typeof MemberPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Everything an administrator sees: follow-up form, attendance, history, packages and purchases. */
export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "Priya Sharma" })).toBeVisible();
    const main = within(canvas.getByRole("main"));
    await expect(main.getByText("Member #101")).toBeVisible();
    await expect(main.getByText("Record a follow-up")).toBeVisible();
    await expect(await main.findByText("Attendance")).toBeVisible();
    await expect(main.getByText("3 visits recorded")).toBeVisible();
    await expect(await main.findByText("Purchases")).toBeVisible();
    await expect(main.getByRole("link", { name: "Edit details" })).toHaveAttribute("href", `/members/${member.id}/edit`);
    await expect(getMemberCalendar).toHaveBeenCalledWith(member.id, expect.any(String), member.joinedOn);
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "Priya Sharma" })).toBeVisible();
    await expect(await canvas.findByText("Follow-up record")).toBeVisible();
  },
};

/** Health conditions, complaints, remarks and the enquiry the member came from. */
export const WithHealthAndEnquiry: Story = {
  beforeEach: () => {
    mocked(getMember).mockResolvedValue(memberWithHealth);
    mocked(getSourceInquiry).mockResolvedValue({ id: "8192a3b4-0000-4000-8000-000000000001", serialNo: 57, inquiredOn: daysFromToday(-130), source: "walk_in" });
  },
  play: async ({ canvas }) => {
    const main = within(await canvas.findByRole("main"));
    await expect(await main.findByText("Blood pressure")).toBeVisible();
    await expect(main.getByText("Pain: Back, Knee")).toBeVisible();
    await expect(main.getByText(memberWithHealth.remarks!)).toBeVisible();
    await expect(main.getByRole("link", { name: "Enquiry #57" })).toBeVisible();
  },
};

/** Just enrolled: no package, no follow-ups, no visits, nothing bought. */
export const NewMember: Story = {
  args: { params: Promise.resolve({ id: newMember.id }) },
  beforeEach: () => {
    mocked(getMember).mockResolvedValue(newMember);
    mocked(getMemberCalendar).mockResolvedValue(noVisits);
    mocked(listMemberSales).mockResolvedValue([]);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "Lakshmi Narayanan" })).toBeVisible();
    const main = within(canvas.getByRole("main"));
    await expect(main.getByText("Add a package to start tracking the programme.")).toBeVisible();
    await expect(main.getByText("No visits recorded yet.")).toBeVisible();
    await expect(await main.findByText("Has not checked in yet.")).toBeVisible();
    await expect(await main.findByText(/Nothing bought yet/)).toBeVisible();
  },
};

/** Read-only profile: no edit, delete, follow-up form or package actions. */
export const ViewOnly: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(viewerUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "Priya Sharma" })).toBeVisible();
    const main = within(canvas.getByRole("main"));
    await expect(main.queryByText("Record a follow-up")).toBeNull();
    await expect(main.queryByRole("link", { name: "Edit details" })).toBeNull();
    await expect(main.queryByRole("link", { name: "New package" })).toBeNull();
    await expect(main.queryByRole("link", { name: "Sell products" })).toBeNull();
    await expect(await main.findByText("Purchases")).toBeVisible();
  },
};

/** Without attendance.view and stock.view, those cards (and their queries) are skipped. */
export const WithoutAttendanceOrStock: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue({ ...viewerUser, permissions: ["members.view"] });
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "Priya Sharma" })).toBeVisible();
    const main = within(canvas.getByRole("main"));
    await expect(main.queryByText("Attendance")).toBeNull();
    await expect(main.queryByText("Purchases")).toBeNull();
    await expect(getMemberCalendar).not.toHaveBeenCalled();
    await expect(listMemberSales).not.toHaveBeenCalled();
  },
};

/** The header's Delete asks first, then calls `deleteMember(id)`. */
export const DeleteMember: Story = {
  play: async ({ canvas, userEvent }) => {
    await canvas.findByRole("heading", { level: 1, name: "Priya Sharma" });
    // The header's button comes first; packages and follow-ups have their own.
    const [headerDelete] = within(canvas.getByRole("main")).getAllByRole("button", { name: "Delete" });
    await userEvent.click(headerDelete!);
    const dialog = await screen.findByRole("dialog", { name: "Delete Priya Sharma?" });
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete member" }));
    await expect(deleteMember).toHaveBeenCalledWith(member.id);
  },
};

export const NoAccess: Story = {
  parameters: { a11y: fullCheck },
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(noRoleUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(getMember).not.toHaveBeenCalled();
  },
};
