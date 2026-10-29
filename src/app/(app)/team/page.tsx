import { redirect } from "next/navigation";
import { NoAccess } from "@/components/app/no-access";
import { can } from "@/lib/access/can";
import { getCurrentUser } from "@/lib/session";

/** `/team` lands on Users, or Roles when the role only unlocks that. */
export default async function TeamPage() {
  const user = await getCurrentUser();
  if (can(user, "users.view")) redirect("/team/users");
  if (can(user, "roles.view")) redirect("/team/roles");
  return <NoAccess permission="users.view" />;
}
