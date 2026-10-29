import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { NoAccess } from "@/components/app/no-access";
import { MemberForm } from "@/components/members/member-form";
import { PageHeader, PageHeaderSkeleton } from "@/components/members/field";
import { can } from "@/lib/access/can";
import { createMember } from "@/lib/members/actions";
import { today } from "@/lib/members/dates";
import { listActivePlans } from "@/lib/packages/queries";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "New member",
};

export default function NewMemberPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeaderSkeleton />
          <Skeleton className="h-[40rem] w-full rounded-3xl" />
        </>
      }
    >
      <NewMemberForm />
    </Suspense>
  );
}

async function NewMemberForm() {
  const user = await getCurrentUser();
  if (!can(user, "members.create")) return <NoAccess permission="members.create" />;
  // The default dates depend on the clock, so this renders at request time.
  await connection();
  const now = today();
  const plans = await listActivePlans();
  return (
    <>
      <PageHeader
        title="New member"
        description="The digital wellness record. Fill in what you know now; everything can be updated later."
      />
      <MemberForm
        mode="create"
        action={createMember}
        defaults={{ joinedOn: now }}
        today={now}
        cancelHref="/members"
        plans={plans}
      />
    </>
  );
}
