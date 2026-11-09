import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { expect, mocked, waitFor, within } from "storybook/test";
import { Kiosk } from "@/components/attendance/kiosk";
import { findKioskMobileMatches, kioskCheckIn } from "@/lib/attendance/actions";
import { withKioskShell } from "@/stories/decorators";
import { checkInResults, kioskMembers, kioskPriya, mobileLookupMember } from "@/stories/fixtures/attendance";
import { TODAY } from "@/stories/fixtures/time";
import { frontDeskUser } from "@/stories/fixtures/users";
import { knownIssues } from "@/stories/a11y";

type Canvas = ReturnType<typeof within>;

const search = (canvas: Canvas) => canvas.getByRole("searchbox", { name: "Search by name, mobile or member number" });

/** Tap Priya Sharma's pill and confirm on the dialog. */
async function checkInPriya({ canvas, userEvent }: PlayContext) {
  await userEvent.type(search(canvas), "sharma");
  await userEvent.click(await canvas.findByRole("button", { name: /priya sharma/i }));
  const dialog = within(document.body).getByRole("dialog", { name: "Priya Sharma" });
  await expect(within(dialog).getByText(/Member #101 · mobile ending 2345 · 3 months package, 42 days left/)).toBeInTheDocument();
  await userEvent.click(within(dialog).getByRole("button", { name: "Yes, check me in" }));
  await expect(kioskCheckIn).toHaveBeenCalledWith(kioskPriya.id);
  // The dialog hides the rest of the page from assistive tech until it has gone.
  await waitFor(() => expect(dialog).not.toBeInTheDocument());
}

// The member-facing tablet screen, inside the real kiosk layout.
const meta = {
  title: "Attendance/Kiosk",
  component: Kiosk,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/attendance/kiosk" } },
    // Known issue: in the kiosk header, "Herbalife · Attendance" (text-white/70
    // on brand-600) measures 4.4:1, under the 4.5:1 AA minimum; the member
    // pills' "#101 · ••2345" line (opacity-60 on the pastel tints) measures
    // 3.8–4.3:1; and the result screen's stat labels (text-white/65, 3.35:1),
    // hint (text-white/60, 3.69:1) and error hint (text-white/70 on red, 3.4:1)
    // fall short too. All are colour choices
    // in kiosk.tsx, member-rail.tsx and kiosk-result.tsx: a design change.
    a11y: knownIssues("color-contrast"),
  },
  globals: { viewport: { value: "tablet" } },
  decorators: [withKioskShell],
  args: { members: kioskMembers, today: TODAY, initialTodayVisits: 23, staffName: frontDeskUser.name },
} satisfies Meta<typeof Kiosk>;

export default meta;
type Story = StoryObj<typeof meta>;
type PlayContext = Parameters<NonNullable<Story["play"]>>[0];

export const Idle: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Welcome! Tap your name to check in." })).toBeVisible();
    await expect(canvas.getByText("Monday, 9 November 2026")).toBeVisible();
    await expect(canvas.getAllByRole("listitem")).toHaveLength(kioskMembers.length);
  },
};

export const NoActiveMembers: Story = {
  args: { members: [], initialTodayVisits: 0 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No active members yet")).toBeVisible();
  },
};

/** Typing a name narrows the belt; two Priyas are told apart by their mobile. */
export const Searching: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(search(canvas), "pri");
    await waitFor(() => expect(canvas.getAllByRole("listitem")).toHaveLength(2));
    await expect(canvas.getByRole("button", { name: /priya sharma/i })).toHaveTextContent("••2345");
    await expect(canvas.getByRole("button", { name: /priya nair/i })).toHaveTextContent("••7781");
    await userEvent.click(canvas.getByRole("button", { name: "Clear" }));
    await expect(search(canvas)).toHaveValue("");
    await expect(canvas.getAllByRole("listitem")).toHaveLength(kioskMembers.length);
  },
};

export const MemberNumber: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(search(canvas), "#134");
    await expect(await canvas.findByRole("button", { name: /priya nair/i })).toBeVisible();
  },
};

export const NoMatch: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(search(canvas), "zzz");
    await expect(await canvas.findByText("No one found for “zzz”")).toBeVisible();
    await expect(findKioskMobileMatches).not.toHaveBeenCalled();
  },
};

/** Too few digits to look up as a mobile, and no member has that number. */
export const KeepTyping: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(search(canvas), "99");
    await expect(await canvas.findByText("Keep typing")).toBeVisible();
  },
};

/** Longer numbers go to the server, which alone knows full mobiles. */
export const MobileNumber: Story = {
  beforeEach: () => {
    mocked(findKioskMobileMatches).mockResolvedValue([mobileLookupMember.id]);
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(search(canvas), "98400 77");
    await waitFor(() => expect(findKioskMobileMatches).toHaveBeenLastCalledWith("9840077"));
    await expect(await canvas.findByRole("button", { name: /lakshmi venkatesh/i })).toBeVisible();
    await expect(canvas.getAllByRole("listitem")).toHaveLength(1);
  },
};

/** While the number is being looked up, the screen says so. */
export const MobileLookingUp: Story = {
  beforeEach: () => {
    mocked(findKioskMobileMatches).mockImplementation(() => new Promise<string[]>(() => {}));
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(search(canvas), "98400 00");
    await expect(await canvas.findByText("Searching…")).toBeVisible();
  },
};

export const MobileNotFound: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(search(canvas), "90000 11");
    await expect(await canvas.findByText("No one found for “90000 11”")).toBeVisible();
    await expect(findKioskMobileMatches).toHaveBeenCalledWith("9000011");
  },
};

export const CheckedIn: Story = {
  beforeEach: () => {
    mocked(kioskCheckIn).mockResolvedValue(checkInResults.checkedIn);
  },
  play: async (ctx) => {
    const { canvas, userEvent } = ctx;
    await checkInPriya(ctx);
    await waitFor(() => expect(canvas.getByRole("heading", { name: "Welcome, Priya!" })).toBeVisible());
    // The header count follows the server's figure.
    await expect(canvas.getByText(/check-ins today/)).toHaveTextContent("24 check-ins today");
    // Any tap goes back to search.
    await userEvent.click(canvas.getByRole("button", { name: /Welcome, Priya!/ }));
    await waitFor(() => expect(search(canvas)).toHaveValue(""));
    await expect(canvas.queryByRole("heading", { name: "Welcome, Priya!" })).not.toBeInTheDocument();
  },
};

export const AlreadyCheckedIn: Story = {
  beforeEach: () => {
    mocked(kioskCheckIn).mockResolvedValue(checkInResults.already);
  },
  play: async (ctx) => {
    const { canvas } = ctx;
    await checkInPriya(ctx);
    await waitFor(() => expect(canvas.getByRole("heading", { name: /already in, Priya/ })).toBeVisible());
    await expect(canvas.getByText(/check-ins today/)).toHaveTextContent("23 check-ins today");
  },
};

/** The package ended since the list loaded: the kiosk refreshes to take them off. */
export const NoActivePackage: Story = {
  beforeEach: () => {
    mocked(kioskCheckIn).mockResolvedValue(checkInResults.noPackage);
  },
  play: async (ctx) => {
    const { canvas } = ctx;
    await checkInPriya(ctx);
    await waitFor(() => expect(canvas.getByRole("heading", { name: "No active package, Priya" })).toBeVisible());
    await expect(getRouter().refresh).toHaveBeenCalled();
  },
};

export const CheckInError: Story = {
  beforeEach: () => {
    mocked(kioskCheckIn).mockResolvedValue(checkInResults.error);
  },
  play: async (ctx) => {
    const { canvas } = ctx;
    await checkInPriya(ctx);
    await waitFor(() => expect(canvas.getByRole("heading", { name: "Something went wrong" })).toBeVisible());
    await waitFor(() => expect(canvas.getByText(checkInResults.error.message)).toBeVisible());
  },
};

/** "Not me" closes the confirmation without checking anyone in. */
export const NotMe: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /priya nair/i }));
    const dialog = within(document.body).getByRole("dialog", { name: "Priya Nair" });
    await expect(within(dialog).getByText(/3 days left/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Not me" }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(kioskCheckIn).not.toHaveBeenCalled();
  },
};

export const Phone: Story = { globals: { viewport: { value: "mobile" } } };
