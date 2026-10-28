import type { LucideIcon } from "lucide-react";
import { CalendarCheckIcon, LayoutDashboardIcon, MessageSquareMoreIcon, PackageIcon, UsersRoundIcon } from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** When set, the item is only active on an exact match (not on sub-routes). */
  exact?: boolean;
};

/**
 * The primary navigation: one pill per module, shown across the top of every
 * admin screen. Creating records and Attendance Mode are actions inside the
 * module pages rather than destinations of their own.
 */
export const navigation: readonly NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Members", href: "/members", icon: UsersRoundIcon },
  { title: "Enquiries", href: "/inquiries", icon: MessageSquareMoreIcon },
  { title: "Packages", href: "/packages", icon: PackageIcon },
  { title: "Attendance", href: "/attendance", icon: CalendarCheckIcon },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (pathname === item.href) return true;
  if (item.exact) return false;
  return pathname.startsWith(`${item.href}/`);
}

export function findNavItem(pathname: string): NavItem | undefined {
  // Prefer the most specific match so a deeper href wins over its parent.
  let best: NavItem | undefined;
  for (const item of navigation) {
    if (isNavItemActive(item, pathname) && (!best || item.href.length > best.href.length)) {
      best = item;
    }
  }
  return best;
}
