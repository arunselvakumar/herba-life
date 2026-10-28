import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PackagePlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/members/field";
import { PlanTable } from "@/components/packages/plan-table";
import { listPlans } from "@/lib/packages/queries";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Packages",
};

export default function PackagesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-72 w-full rounded-3xl" />}>
      <Packages />
    </Suspense>
  );
}

async function Packages() {
  const [user, plans] = await Promise.all([getCurrentUser(), listPlans()]);
  const canEdit = user.role === "admin";

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Packages"
        description={
          canEdit
            ? "The programmes this branch offers. Members are enrolled in one of these from their join date."
            : "The programmes this branch offers. Ask an administrator to add or change packages."
        }
        actions={
          canEdit ? (
            <Button asChild size="lg">
              <Link href="/packages/new">
                <PackagePlusIcon data-icon="inline-start" />
                New package
              </Link>
            </Button>
          ) : undefined
        }
      />
      <PlanTable plans={plans} canEdit={canEdit} />
    </>
  );
}
