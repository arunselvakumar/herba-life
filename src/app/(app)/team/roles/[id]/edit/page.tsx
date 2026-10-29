import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { NoAccess } from "@/components/app/no-access";
import { PageHeader } from "@/components/members/field";
import { RoleForm } from "@/components/team/role-form";
import { Skeleton } from "@/components/ui/skeleton";
import { updateRole } from "@/lib/access/actions";
import { can } from "@/lib/access/can";
import { getRole } from "@/lib/access/queries";
import { UUID_RE } from "@/lib/members/form-defaults";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Edit role",
};

export default function EditRolePage(props: PageProps<"/team/roles/[id]/edit">) {
  return (
    <Suspense fallback={<Skeleton className="h-[40rem] w-full rounded-3xl" />}>
      <EditRole params={props.params} />
    </Suspense>
  );
}

async function EditRole({ params }: { params: PageProps<"/team/roles/[id]/edit">["params"] }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const user = await getCurrentUser();
  if (!can(user, "roles.update")) return <NoAccess permission="roles.update" />;
  await connection();
  const role = await getRole(id);
  if (!role) notFound();
  const holders = `${role.userCount} user${role.userCount === 1 ? "" : "s"}`;

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title={role.isSystem ? role.name : `Edit ${role.name}`}
        description={
          role.isSystem
            ? `Built in and read only. ${holders} hold this role.`
            : `Changes apply to the ${holders} on this role the next time they load a page.`
        }
      />
      <RoleForm
        action={updateRole.bind(null, role.id)}
        defaults={{ name: role.name, description: role.description ?? "", "permissions[]": role.permissions }}
        submitLabel="Save changes"
        readOnly={role.isSystem}
        lockedPermission={user.roleId === role.id ? "roles.update" : undefined}
      />
    </>
  );
}
