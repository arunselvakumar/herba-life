import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { NoAccess } from "@/components/app/no-access";
import { PageHeader } from "@/components/members/field";
import { UserForm } from "@/components/team/user-form";
import { Skeleton } from "@/components/ui/skeleton";
import { createUser } from "@/lib/access/actions";
import { can } from "@/lib/access/can";
import { listRoleOptions } from "@/lib/access/queries";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "New user",
};

export default function NewUserPage() {
  return (
    <Suspense fallback={<Skeleton className="h-72 w-full rounded-3xl" />}>
      <NewUser />
    </Suspense>
  );
}

async function NewUser() {
  const user = await getCurrentUser();
  if (!can(user, "users.create")) return <NoAccess permission="users.create" />;
  await connection();
  const roles = await listRoleOptions();
  const staff = roles.find((r) => !r.isSystem);
  return (
    <>
      <PageHeader eyebrow="Team" title="New user" description="Create a sign-in for a colleague and pick the role that fits their job." />
      <div className="max-w-4xl">
        <UserForm action={createUser} defaults={{ roleId: staff?.id ?? "" }} roles={roles} mode="create" submitLabel="Create user" />
      </div>
    </>
  );
}
