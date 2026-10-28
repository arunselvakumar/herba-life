import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { InquiryForm } from "@/components/inquiries/inquiry-form";
import { PageHeader } from "@/components/members/field";
import { createInquiry } from "@/lib/inquiries/actions";
import { listMemberOptions, listStaff } from "@/lib/inquiries/queries";
import { today } from "@/lib/members/dates";
import { listActivePlans } from "@/lib/packages/queries";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "New inquiry",
};

export default function NewInquiryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Inquiries"
        title="New inquiry"
        description="Capture what you learn in the first conversation. Only a first name is needed to save; add the rest as you go."
      />
      <Suspense fallback={<Skeleton className="h-[40rem] w-full rounded-xl" />}>
        <NewInquiryForm />
      </Suspense>
    </>
  );
}

async function NewInquiryForm() {
  await connection();
  const now = today();
  const [user, plans, staff, members] = await Promise.all([getCurrentUser(), listActivePlans(), listStaff(), listMemberOptions()]);
  return (
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
  );
}
