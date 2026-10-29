"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheckIcon, UserCogIcon, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS: readonly { href: string; label: string; icon: LucideIcon; key: "users" | "roles" }[] = [
  { href: "/team/users", label: "Users", icon: UserCogIcon, key: "users" },
  { href: "/team/roles", label: "Roles", icon: ShieldCheckIcon, key: "roles" },
];

/** Users | Roles switcher under the Team page header. Tabs the role cannot see are left out. */
export function TeamTabs({ show }: { show: { users: boolean; roles: boolean } }) {
  const pathname = usePathname();
  const tabs = TABS.filter((t) => show[t.key]);
  if (tabs.length < 2) return null;
  return (
    <nav aria-label="Team sections" className="flex flex-wrap gap-1.5">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 transition-[background-color,color,box-shadow] duration-200",
              active ? "bg-primary text-primary-foreground ring-primary" : "bg-card text-muted-foreground ring-border hover:text-foreground hover:ring-foreground/30",
            )}
          >
            <tab.icon className="size-4 opacity-80" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
