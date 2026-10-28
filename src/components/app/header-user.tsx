import { getCurrentUser } from "@/lib/session";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMenu } from "./user-menu";

export async function HeaderUser() {
  const user = await getCurrentUser();
  return <UserMenu user={user} />;
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
