import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/members/field";
import { PlanForm } from "@/components/packages/plan-form";
import { UUID_RE } from "@/lib/members/form-defaults";
import { updatePlan } from "@/lib/packages/actions";
import { getPlan } from "@/lib/packages/queries";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Edit package",
};

export default function EditPackagePage(props: PageProps<"/packages/[id]/edit">) {
  return (
    <Suspense fallback={<Skeleton className="h-72 w-full rounded-3xl" />}>
      <EditPlan params={props.params} />
    </Suspense>
  );
}

async function EditPlan({ params }: { params: PageProps<"/packages/[id]/edit">["params"] }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const [user, plan] = await Promise.all([getCurrentUser(), getPlan(id)]);
  if (!plan) notFound();
  if (user.role !== "admin") redirect("/packages");

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title={`Edit ${plan.name}`}
        description="Changes apply to new enrolments only; members already enrolled keep the values they signed up with."
      />
      <div className="max-w-4xl">
        <PlanForm
          action={updatePlan.bind(null, plan.id)}
          defaults={{
            name: plan.name,
            durationDays: String(plan.durationDays),
            price: plan.price === null ? "" : String(plan.price),
            description: plan.description ?? "",
            sortOrder: String(plan.sortOrder),
          }}
          submitLabel="Save changes"
        />
      </div>
    </>
  );
}
