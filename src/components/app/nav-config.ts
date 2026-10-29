import type { LucideIcon } from "lucide-react";
import {
  CalendarCheckIcon,
  LayoutDashboardIcon,
  MessageSquareMoreIcon,
  PackageIcon,
  ShieldUserIcon,
  UsersRoundIcon,
} from "lucide-react";
import { canAny, type PermissionHolder } from "@/lib/access/can";
import type { Permission } from "@/lib/access/permissions";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Shown when the user holds any of these. */
  permissions: readonly Permission[];
  /** When set, the item is only active on an exact match (not on sub-routes). */
  exact?: boolean;
};

/**
 * The primary navigation: one pill per module, shown across the top of every
 * admin screen. Creating records and Attendance Mode are actions inside the
 * module pages rather than destinations of their own. Items the signed-in
 * user's role does not unlock are left out entirely.
 */
export const navigation: readonly NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon, permissions: ["dashboard.view"] },
  { title: "Members", href: "/members", icon: UsersRoundIcon, permissions: ["members.view"] },
  { title: "Enquiries", href: "/inquiries", icon: MessageSquareMoreIcon, permissions: ["inquiries.view"] },
  { title: "Packages", href: "/packages", icon: PackageIcon, permissions: ["packages.view"] },
  { title: "Attendance", href: "/attendance", icon: CalendarCheckIcon, permissions: ["attendance.view"] },
  { title: "Team", href: "/team", icon: ShieldUserIcon, permissions: ["users.view", "roles.view"] },
];

export function visibleNavigation(holder: PermissionHolder): NavItem[] {
  return navigation.filter((item) => canAny(holder, item.permissions));
}

/** Where to land after sign-in: the first module the role can see. */
export function homeFor(holder: PermissionHolder): string {
  return visibleNavigation(holder)[0]?.href ?? "/dashboard";
}

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (pathname === item.href) return true;
  if (item.exact) return false;
  return pathname.startsWith(`${item.href}/`);
}

export function findNavItem(items: readonly NavItem[], pathname: string): NavItem | undefined {
  // Prefer the most specific match so a deeper href wins over its parent.
  let best: NavItem | undefined;
  for (const item of items) {
    if (isNavItemActive(item, pathname) && (!best || item.href.length > best.href.length)) {
      best = item;
    }
  }
  return best;
}
