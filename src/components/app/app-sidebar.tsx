import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
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
            className="text-white"
            markClassName="size-8 text-brand-200 group-data-[collapsible=icon]:size-6"
            wordmarkClassName="text-base group-data-[collapsible=icon]:hidden"
            subtitle="Internal"
          />
        </Link>
      </SidebarHeader>
      <SidebarSeparator className="mx-0 bg-sidebar-border" />
      <SidebarContent>
        <NavMain />
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
