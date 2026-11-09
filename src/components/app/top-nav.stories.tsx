import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { navigation, visibleNavigation } from "@/components/app/nav-config";
import { TopNav, TopNavSkeleton } from "@/components/app/top-nav";
import { frontDeskUser } from "@/stories/fixtures/users";

const allHrefs = navigation.map((item) => item.href);

const meta = {
  title: "App/TopNav",
  component: TopNav,
  parameters: { layout: "padded", nextjs: { navigation: { pathname: "/dashboard" } } },
  args: { hrefs: allHrefs },
} satisfies Meta<typeof TopNav>;

export default meta;
type Story = StoryObj<typeof meta>;

function activeRoute(pathname: string, name: string): Story {
  return {
    parameters: { nextjs: { navigation: { pathname } } },
    play: async ({ canvas }) => {
      await expect(canvas.getByRole("link", { name })).toHaveAttribute("aria-current", "page");
      await expect(canvas.getAllByRole("link").filter((link) => link.getAttribute("aria-current") === "page")).toHaveLength(1);
    },
  };
}

export const Dashboard = activeRoute("/dashboard", "Dashboard");
/** A sub-route still lights up its module. */
export const MemberDetail = activeRoute("/members/1a2b3c4d-0000-4000-8000-000000000001", "Members");
export const Enquiries = activeRoute("/inquiries", "Enquiries");
export const Packages = activeRoute("/packages", "Packages");
export const Attendance = activeRoute("/attendance", "Attendance");
export const StockSales = activeRoute("/stock/sales", "Stock");
export const Team = activeRoute("/team/roles", "Team");

/** A page outside every module, such as Backup & export: no pill is highlighted. */
export const NoActiveRoute: Story = {
  parameters: { nextjs: { navigation: { pathname: "/export" } } },
  play: async ({ canvas }) => {
    for (const link of canvas.getAllByRole("link")) {
      await expect(link).not.toHaveAttribute("aria-current");
    }
  },
};

/** Only the modules the front desk role unlocks. */
export const FrontDesk: Story = {
  args: { hrefs: visibleNavigation(frontDeskUser).map((item) => item.href) },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("link", { name: "Team" })).toBeNull();
    await expect(canvas.queryByRole("link", { name: "Packages" })).toBeNull();
  },
};

/** The Suspense fallback while the role is read: plain pills, nothing highlighted. */
export const Skeleton: Story = {
  render: () => <TopNavSkeleton />,
};
