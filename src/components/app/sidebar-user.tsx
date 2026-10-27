import { getCurrentUser } from "@/lib/session";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMenu } from "./user-menu";

export async function SidebarUser() {
  const user = await getCurrentUser();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <UserMenu user={user} />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/**
 * Deterministic skeleton. The stock `SidebarMenuSkeleton` randomises its
 * width, which Cache Components rejects inside a prerendered fallback.
 */
export function SidebarUserSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex h-12 items-center gap-2 px-2">
          <Skeleton className="size-8 rounded-lg bg-white/10" />
          <div className="flex flex-1 flex-col gap-1.5 group-data-[collapsible=icon]:hidden">
            <Skeleton className="h-3 w-24 bg-white/10" />
            <Skeleton className="h-2.5 w-32 bg-white/10" />
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
