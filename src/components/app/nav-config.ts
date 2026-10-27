import type { LucideIcon } from "lucide-react";
import {
  BarChart3Icon,
  BoxesIcon,
  LayoutDashboardIcon,
  PackageIcon,
  SettingsIcon,
  UsersIcon,
  WarehouseIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
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
    label: "Operations",
    items: [
      { title: "Distributors", href: "/distributors", icon: UsersIcon },
      { title: "Orders", href: "/orders", icon: PackageIcon, badge: "742" },
      { title: "Products", href: "/products", icon: BoxesIcon },
      { title: "Inventory", href: "/inventory", icon: WarehouseIcon },
    ],
  },
  {
    label: "Insights",
    items: [{ title: "Reports", href: "/reports", icon: BarChart3Icon }],
  },
  {
    label: "System",
    items: [{ title: "Settings", href: "/settings", icon: SettingsIcon }],
  },
];

export function findNavItem(pathname: string): NavItem | undefined {
  for (const group of navigation) {
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        return item;
      }
    }
  }
  return undefined;
}
