import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { NoAccess } from "@/components/app/no-access";
import { PageHeader } from "@/components/members/field";
import { PlanForm } from "@/components/packages/plan-form";
import { can } from "@/lib/access/can";
import { createPlan } from "@/lib/packages/actions";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "New package",
};

export default function NewPackagePage() {
  return (
    <Suspense fallback={<Skeleton className="h-72 w-full rounded-3xl" />}>
      <NewPlan />
    </Suspense>
  );
}

async function NewPlan() {
  const user = await getCurrentUser();
  if (!can(user, "packages.create")) return <NoAccess permission="packages.create" />;
  return (
    <>
      <PageHeader eyebrow="Catalog" title="New package" description="Add a programme members can be enrolled in." />
      <div className="max-w-4xl">
        <PlanForm action={createPlan} defaults={{}} submitLabel="Create package" />
      </div>
    </>
  );
}
