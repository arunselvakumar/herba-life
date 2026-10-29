import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { UserRoundPlusIcon } from "lucide-react";
import { NoAccess } from "@/components/app/no-access";
import { PageHeader } from "@/components/members/field";
import { TeamTabs } from "@/components/team/team-tabs";
import { UserTable } from "@/components/team/user-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { can } from "@/lib/access/can";
import { listUsers } from "@/lib/access/queries";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Users",
};

export default function UsersPage() {
  return (
    <Suspense fallback={<TeamSkeleton />}>
      <Users />
    </Suspense>
  );
}

async function Users() {
  const user = await getCurrentUser();
  if (!can(user, "users.view")) return <NoAccess permission="users.view" />;
  await connection();
  const now = new Date();
  const users = await listUsers();
  const canCreate = can(user, "users.create");

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="Users"
        description="Everyone who can sign in to this console, and the role that decides what they can do."
        actions={
          canCreate ? (
            <Button asChild size="lg">
              <Link href="/team/users/new">
                <UserRoundPlusIcon data-icon="inline-start" />
                New user
              </Link>
            </Button>
          ) : undefined
        }
      />
      <TeamTabs show={{ users: true, roles: can(user, "roles.view") }} />
      <UserTable
        users={users}
        currentUserId={user.id}
        now={now}
        canCreate={canCreate}
        canUpdate={can(user, "users.update")}
        canDelete={can(user, "users.delete")}
      />
    </>
  );
}

export function TeamSkeleton() {
  return (
    <>
      <div className="space-y-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-9 w-44 rounded-full" />
      <Skeleton className="h-72 w-full rounded-3xl" />
    </>
  );
}
