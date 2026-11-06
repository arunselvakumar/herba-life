import { Suspense } from "react";
import { redirect } from "next/navigation";
import { NoAccess } from "@/components/app/no-access";
import { Skeleton } from "@/components/ui/skeleton";
import { can } from "@/lib/access/can";
import { getCurrentUser } from "@/lib/session";

/** `/team` lands on Users, or Roles when the role only unlocks that. */
export default function TeamPage() {
  return (
    <Suspense fallback={<Skeleton className="h-72 w-full rounded-3xl" />}>
      <TeamLanding />
    </Suspense>
  );
}

/** Reads the session, so it runs at request time behind the Suspense boundary like every other page. */
async function TeamLanding() {
  const user = await getCurrentUser();
  if (can(user, "users.view")) redirect("/team/users");
  if (can(user, "roles.view")) redirect("/team/roles");
  return <NoAccess permission="users.view" />;
}
