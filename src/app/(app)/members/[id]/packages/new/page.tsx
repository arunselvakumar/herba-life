import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/members/field";
import { PackageForm } from "@/components/members/package-form";
import { createPackage } from "@/lib/members/actions";
import { today } from "@/lib/members/dates";
import { UUID_RE } from "@/lib/members/form-defaults";
import { fullName } from "@/lib/members/format";
import { getMember } from "@/lib/members/queries";
import { listActivePlans } from "@/lib/packages/queries";

export const metadata: Metadata = {
  title: "New package",
};

export default function NewPackagePage(props: PageProps<"/members/[id]/packages/new">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <NewPackage params={props.params} />
    </Suspense>
  );
}

async function NewPackage({ params }: { params: PageProps<"/members/[id]/packages/new">["params"] }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const member = await getMember(id);
  if (!member) notFound();
  await connection();
  const plans = await listActivePlans();

  return (
    <>
      <PageHeader
        eyebrow={`Member #${member.serialNo}`}
        title={`New package for ${fullName(member)}`}
        description="Choose a package from the catalog. Extra days extend it beyond its base duration."
      />
      <div className="max-w-4xl">
        <PackageForm action={createPackage.bind(null, member.id)} today={today()} cancelHref={`/members/${member.id}`} plans={plans} />
      </div>
    </>
  );
}
