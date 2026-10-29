import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ShieldPlusIcon } from "lucide-react";
import { ExportButton } from "@/components/app/export-button";
import { NoAccess } from "@/components/app/no-access";
import { PageHeader } from "@/components/members/field";
import { RoleTable } from "@/components/team/role-table";
import { TeamTabs } from "@/components/team/team-tabs";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/access/can";
import { listRoles } from "@/lib/access/queries";
import { getCurrentUser } from "@/lib/session";
import { TeamSkeleton } from "../users/page";

export const metadata: Metadata = {
  title: "Roles",
};

export default function RolesPage() {
  return (
    <Suspense fallback={<TeamSkeleton />}>
      <Roles />
    </Suspense>
  );
}

async function Roles() {
  const user = await getCurrentUser();
  if (!can(user, "roles.view")) return <NoAccess permission="roles.view" />;
  await connection();
  const roles = await listRoles();
  const canCreate = can(user, "roles.create");
  const canExport = can(user, "roles.export");

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="Roles"
        description="A role is a named set of permissions. Give each kind of staff member a role, and every new module shows up here as it ships."
        actions={
          canCreate || canExport ? (
            <>
              {canExport ? <ExportButton module="roles" /> : null}
              {canCreate ? (
                <Button asChild size="lg">
                  <Link href="/team/roles/new">
                    <ShieldPlusIcon data-icon="inline-start" />
                    New role
                  </Link>
                </Button>
              ) : null}
            </>
          ) : undefined
        }
      />
      <TeamTabs show={{ users: can(user, "users.view"), roles: true }} />
      <RoleTable roles={roles} canCreate={canCreate} canUpdate={can(user, "roles.update")} canDelete={can(user, "roles.delete")} />
    </>
  );
}
