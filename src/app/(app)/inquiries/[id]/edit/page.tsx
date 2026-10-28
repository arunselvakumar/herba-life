import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { InquiryForm } from "@/components/inquiries/inquiry-form";
import { PageHeader } from "@/components/members/field";
import { updateInquiry } from "@/lib/inquiries/actions";
import { isOpenStatus } from "@/lib/inquiries/constants";
import { inquiryToDefaults } from "@/lib/inquiries/form-defaults";
import { getInquiry, listMemberOptions, listStaff } from "@/lib/inquiries/queries";
import { today } from "@/lib/members/dates";
import { UUID_RE } from "@/lib/members/form-defaults";
import { fullName } from "@/lib/members/format";
import { listActivePlans, getPlan } from "@/lib/packages/queries";

export const metadata: Metadata = {
  title: "Edit inquiry",
};

export default function EditInquiryPage(props: PageProps<"/inquiries/[id]/edit">) {
  return (
    <Suspense fallback={<Skeleton className="h-[40rem] w-full rounded-xl" />}>
      <EditInquiry params={props.params} />
    </Suspense>
  );
}

async function EditInquiry({ params }: { params: PageProps<"/inquiries/[id]/edit">["params"] }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const inquiry = await getInquiry(id);
  if (!inquiry) notFound();
  // Closed inquiries are read-only; reopen a lost one first.
  if (!isOpenStatus(inquiry.status)) redirect(`/inquiries/${inquiry.id}`);
  await connection();

  const [plans, staff, members] = await Promise.all([listActivePlans(), listStaff(), listMemberOptions()]);
  // Keep an archived package selectable on the inquiry that already has it.
  if (inquiry.interestedPlanId && !plans.some((p) => p.id === inquiry.interestedPlanId)) {
    const archived = await getPlan(inquiry.interestedPlanId);
    if (archived) plans.push(archived);
  }

  return (
    <>
      <PageHeader eyebrow={`Inquiry #${inquiry.serialNo}`} title={`Edit ${fullName(inquiry)}`} description="Update what you know about this person." />
      <InquiryForm
        mode="edit"
        action={updateInquiry.bind(null, inquiry.id)}
        defaults={inquiryToDefaults(inquiry)}
        today={today()}
        cancelHref={`/inquiries/${inquiry.id}`}
        plans={plans}
        staff={staff}
        members={members}
      />
    </>
  );
}
