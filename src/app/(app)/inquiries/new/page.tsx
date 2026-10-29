import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { NoAccess } from "@/components/app/no-access";
import { InquiryForm } from "@/components/inquiries/inquiry-form";
import { PageHeader, PageHeaderSkeleton } from "@/components/members/field";
import { can } from "@/lib/access/can";
import { createInquiry } from "@/lib/inquiries/actions";
import { listMemberOptions, listStaff } from "@/lib/inquiries/queries";
import { today } from "@/lib/members/dates";
import { listActivePlans } from "@/lib/packages/queries";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "New enquiry",
};

export default function NewInquiryPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeaderSkeleton />
          <Skeleton className="h-[40rem] w-full rounded-3xl" />
        </>
      }
    >
      <NewInquiryForm />
    </Suspense>
  );
}

async function NewInquiryForm() {
  const user = await getCurrentUser();
  if (!can(user, "inquiries.create")) return <NoAccess permission="inquiries.create" />;
  await connection();
  const now = today();
  const [plans, staff, members] = await Promise.all([listActivePlans(), listStaff(), listMemberOptions()]);
  return (
    <>
      <PageHeader
        eyebrow="Enquiries"
        title="New enquiry"
        description="Capture what you learn in the first conversation. Only a first name is needed to save; add the rest as you go."
      />
      <InquiryForm
        mode="create"
        action={createInquiry}
        defaults={{ inquiredOn: now, source: "walk_in", assignedTo: user.id }}
        today={now}
        cancelHref="/inquiries"
        plans={plans}
        staff={staff}
        members={members}
      />
    </>
  );
}
