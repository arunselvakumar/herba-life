import type { LucideIcon } from "lucide-react";
import { CalendarCheckIcon, LayoutDashboardIcon, MessageSquareMoreIcon, MessageSquarePlusIcon, MonitorCheckIcon, PackageIcon, UserRoundPlusIcon, UsersRoundIcon } from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** When set, the item is only active on an exact match (not on sub-routes). */
  exact?: boolean;
};

export type NavGroup = {
  label: string;
  items: readonly NavItem[];
};

export const navigation: readonly NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon }],
  },
  {
    label: "Members",
    items: [
      { title: "All members", href: "/members", icon: UsersRoundIcon },
      { title: "New member", href: "/members/new", icon: UserRoundPlusIcon, exact: true },
    ],
  },
  {
    label: "Inquiries",
    items: [
      { title: "All inquiries", href: "/inquiries", icon: MessageSquareMoreIcon },
      { title: "New inquiry", href: "/inquiries/new", icon: MessageSquarePlusIcon, exact: true },
    ],
  },
  {
    label: "Catalog",
    items: [{ title: "Packages", href: "/packages", icon: PackageIcon }],
  },
  {
    label: "Attendance",
    items: [
      { title: "Attendance", href: "/attendance", icon: CalendarCheckIcon, exact: true },
      { title: "Attendance Mode", href: "/attendance/kiosk", icon: MonitorCheckIcon, exact: true },
    ],
  },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (pathname === item.href) return true;
  if (item.exact) return false;
  return pathname.startsWith(`${item.href}/`);
}

export function findNavItem(pathname: string): NavItem | undefined {
  // Prefer the most specific match so "/members/new" wins over "/members".
  let best: NavItem | undefined;
  for (const group of navigation) {
    for (const item of group.items) {
      if (isNavItemActive(item, pathname) && (!best || item.href.length > best.href.length)) {
        best = item;
      }
    }
  }
  return best;
}
