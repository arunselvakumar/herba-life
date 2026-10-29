import { can, canAny } from "@/lib/access/can";
import { canExportAnything } from "@/lib/export/catalog";
import { getCurrentUser } from "@/lib/session";
import { Skeleton } from "@/components/ui/skeleton";
import { visibleNavigation } from "./nav-config";
import { TopNav } from "./top-nav";
import { UserMenu } from "./user-menu";

export async function HeaderUser() {
  const user = await getCurrentUser();
  return <UserMenu user={user} canManageTeam={canAny(user, ["users.view", "roles.view"])} canExport={canExportAnything(user)} />;
}

/** Deterministic skeleton: Cache Components reject random widths in fallbacks. */
export function HeaderUserSkeleton() {
  return (
    <div className="flex h-11 items-center gap-2 rounded-full bg-card p-1 pr-3 ring-1 ring-border">
      <Skeleton className="size-9 rounded-full" />
      <Skeleton className="hidden h-3 w-16 lg:block" />
    </div>
  );
}

/** The module pills, limited to what the signed-in user's role unlocks. */
export async function HeaderNav({ className, testId }: { className?: string | undefined; testId?: string | undefined }) {
  const user = await getCurrentUser();
  return <TopNav hrefs={visibleNavigation(user).map((item) => item.href)} className={className} testId={testId} />;
}

/** Header actions that depend on permissions: Attendance Mode and New member. */
export async function HeaderActions({ children }: { children: (allowed: { kiosk: boolean; newMember: boolean }) => React.ReactNode }) {
  const user = await getCurrentUser();
  return <>{children({ kiosk: can(user, "attendance.kiosk"), newMember: can(user, "members.create") })}</>;
}
