import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import DashboardPage from "@/app/(app)/dashboard/page";
import { countDay } from "@/lib/attendance/queries";
import { getInquiryDashboard } from "@/lib/inquiries/queries";
import { getDashboardData } from "@/lib/members/queries";
import { getCurrentUser } from "@/lib/session";
import { getStockDashboard } from "@/lib/stock/queries";
import { withAppShell } from "@/stories/decorators";
import {
  attendanceToday,
  dashboardData,
  emptyDashboardData,
  emptyInquiryDashboard,
  emptyStockDashboard,
  inquiryDashboard,
  noAttendanceToday,
  stockDashboard,
} from "@/stories/fixtures/dashboard";
import { TODAY } from "@/stories/fixtures/time";
import { frontDeskUser, noRoleUser } from "@/stories/fixtures/users";

const meta = {
  title: "Screens/Dashboard",
  component: DashboardPage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/dashboard" } } },
  decorators: [withAppShell],
  globals: { viewport: { value: "desktop" } },
  beforeEach: () => {
    mocked(getDashboardData).mockResolvedValue(dashboardData);
    mocked(getInquiryDashboard).mockResolvedValue(inquiryDashboard);
    mocked(countDay).mockResolvedValue(attendanceToday);
    mocked(getStockDashboard).mockResolvedValue(stockDashboard);
  },
} satisfies Meta<typeof DashboardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Greets by first name and time of day (10:30, so "Good morning"). */
export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { name: "Good morning, Arun." })).toBeVisible();
    const metrics = await canvas.findByRole("region", { name: "Key metrics" });
    await expect(metrics).toHaveTextContent("Members");
    await expect(await canvas.findByRole("link", { name: "Open Members" })).toHaveAttribute("href", "/members");
    await expect(await canvas.findByText("Packages ending soon")).toBeVisible();
    await expect(canvas.getAllByRole("link", { name: "Anjali Menon" }).length).toBeGreaterThan(0);
    await expect(getDashboardData).toHaveBeenCalledWith(TODAY);
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("region", { name: "Key metrics" })).toBeInTheDocument();
    await expect(await canvas.findByText("Packages ending soon")).toBeInTheDocument();
  },
};

/** Front desk: no Packages module, so the figures still show but fewer links lead anywhere. */
export const FrontDesk: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { name: "Good morning, Meena." })).toBeVisible();
    await expect(await canvas.findByRole("link", { name: "Open Running low" })).toBeInTheDocument();
  },
};

/** A new branch: every figure is zero and every list shows its empty message. */
export const Empty: Story = {
  beforeEach: () => {
    mocked(getDashboardData).mockResolvedValue(emptyDashboardData);
    mocked(getInquiryDashboard).mockResolvedValue(emptyInquiryDashboard);
    mocked(countDay).mockResolvedValue(noAttendanceToday);
    mocked(getStockDashboard).mockResolvedValue(emptyStockDashboard);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Everyone is up to date.")).toBeInTheDocument();
    await expect(await canvas.findByText("No follow-ups recorded yet.")).toBeInTheDocument();
    await expect(await canvas.findByText("0 products on the shelf")).toBeInTheDocument();
  },
};

export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(noRoleUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
    await expect(getDashboardData).not.toHaveBeenCalled();
  },
};
