import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PackagePlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportButton } from "@/components/app/export-button";
import { NoAccess } from "@/components/app/no-access";
import { PageHeader } from "@/components/members/field";
import { PlanTable } from "@/components/packages/plan-table";
import { can } from "@/lib/access/can";
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
  const user = await getCurrentUser();
  if (!can(user, "packages.view")) return <NoAccess permission="packages.view" />;
  const canCreate = can(user, "packages.create");
  const canUpdate = can(user, "packages.update");
  const canDelete = can(user, "packages.delete");
  const canExport = can(user, "packages.export");
  const plans = await listPlans();

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Packages"
        description={
          canCreate || canUpdate
            ? "The programmes this branch offers. Members are enrolled in one of these from their join date."
            : "The programmes this branch offers. Ask an administrator to add or change packages."
        }
        actions={
          canCreate || canExport ? (
            <>
              {canExport ? <ExportButton module="packages" /> : null}
              {canCreate ? (
                <Button asChild size="lg">
                  <Link href="/packages/new">
                    <PackagePlusIcon data-icon="inline-start" />
                    New package
                  </Link>
                </Button>
              ) : null}
            </>
          ) : undefined
        }
      />
      <PlanTable plans={plans} canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />
    </>
  );
}
