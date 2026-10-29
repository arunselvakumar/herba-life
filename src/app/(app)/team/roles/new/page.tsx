import type { Metadata } from "next";
import { Suspense } from "react";
import { NoAccess } from "@/components/app/no-access";
import { PageHeader } from "@/components/members/field";
import { RoleForm } from "@/components/team/role-form";
import { Skeleton } from "@/components/ui/skeleton";
import { createRole } from "@/lib/access/actions";
import { can } from "@/lib/access/can";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "New role",
};

export default function NewRolePage() {
  return (
    <Suspense fallback={<Skeleton className="h-[40rem] w-full rounded-3xl" />}>
      <NewRole />
    </Suspense>
  );
}

async function NewRole() {
  const user = await getCurrentUser();
  if (!can(user, "roles.create")) return <NoAccess permission="roles.create" />;
  return (
    <>
      <PageHeader eyebrow="Team" title="New role" description="Name the role, then tick exactly what people holding it may do." />
      <RoleForm action={createRole} defaults={{ "permissions[]": ["dashboard.view"] }} submitLabel="Create role" />
    </>
  );
}
