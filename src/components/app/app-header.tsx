"use client";

import { usePathname } from "next/navigation";
import { BellIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { findNavItem } from "./nav-config";

export function AppHeader() {
  const pathname = usePathname();
  const current = findNavItem(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5" />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="text-eyebrow text-[0.6rem] text-muted-foreground">
          Herbalife Internal
        </span>
        <span className="truncate text-sm font-semibold">
          {current?.title ?? "Workspace"}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search distributors, orders…"
            className="h-9 w-72 bg-card pl-8"
            aria-label="Search"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9"
          aria-label="Notifications"
        >
          <BellIcon />
          <span
            aria-hidden
            className="absolute top-2 right-2 size-1.5 rounded-full bg-brand-500"
          />
        </Button>
      </div>
    </header>
  );
}
