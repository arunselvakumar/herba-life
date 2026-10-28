import Link from "next/link";
import { Suspense } from "react";
import { Logo, LogoMark } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { NavList, NavMain } from "./nav-main";
import { SidebarUser, SidebarUserSkeleton } from "./sidebar-user";

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" data-testid="app-sidebar">
      <SidebarHeader className="px-3 py-4">
        <Link
          href="/dashboard"
          className="flex items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <Logo
            className="group-data-[collapsible=icon]:hidden"
            tone="white"
            imageClassName="h-6"
            subtitle="Internal"
          />
          <LogoMark
            className="hidden h-7 group-data-[collapsible=icon]:block"
            tone="white"
          />
        </Link>
      </SidebarHeader>
      <SidebarSeparator className="mx-0 bg-sidebar-border" />
      <SidebarContent>
        <Suspense fallback={<NavList activeHref={null} />}>
          <NavMain />
        </Suspense>
      </SidebarContent>
      <SidebarFooter>
        <Suspense fallback={<SidebarUserSkeleton />}>
          <SidebarUser />
        </Suspense>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
