import type { LucideIcon } from "lucide-react";
import { LayoutDashboardIcon, PackageIcon, UserRoundPlusIcon, UsersRoundIcon } from "lucide-react";

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
    label: "Catalog",
    items: [{ title: "Packages", href: "/packages", icon: PackageIcon }],
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
