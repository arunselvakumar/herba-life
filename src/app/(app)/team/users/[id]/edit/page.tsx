import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { NoAccess } from "@/components/app/no-access";
import { PageHeader } from "@/components/members/field";
import { UserForm } from "@/components/team/user-form";
import { Skeleton } from "@/components/ui/skeleton";
import { updateUser } from "@/lib/access/actions";
import { can } from "@/lib/access/can";
import { getUser, listRoleOptions } from "@/lib/access/queries";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Edit user",
};

export default function EditUserPage(props: PageProps<"/team/users/[id]/edit">) {
  return (
    <Suspense fallback={<Skeleton className="h-72 w-full rounded-3xl" />}>
      <EditUser params={props.params} />
    </Suspense>
  );
}

async function EditUser({ params }: { params: PageProps<"/team/users/[id]/edit">["params"] }) {
  const { id } = await params;
  const current = await getCurrentUser();
  if (!can(current, "users.update")) return <NoAccess permission="users.update" />;
  await connection();
  const [target, roles] = await Promise.all([getUser(id), listRoleOptions()]);
  if (!target) notFound();
  const isSelf = target.id === current.id;

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title={`Edit ${target.name}`}
        description={isSelf ? "Your own account. Your role can only be changed by another administrator." : "Update the account or set a new password. A new password signs them out of other devices."}
      />
      <div className="max-w-4xl">
        <UserForm
          action={updateUser.bind(null, target.id)}
          defaults={{ name: target.name, email: target.email, roleId: target.role?.id ?? "" }}
          roles={roles}
          mode="edit"
          isSelf={isSelf}
          submitLabel="Save changes"
        />
      </div>
    </>
  );
}
