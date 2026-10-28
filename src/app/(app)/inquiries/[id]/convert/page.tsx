import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { SparklesIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberForm } from "@/components/members/member-form";
import { PageHeader } from "@/components/members/field";
import { convertInquiry } from "@/lib/inquiries/actions";
import { inquiryToMemberDefaults } from "@/lib/inquiries/form-defaults";
import { getInquiry } from "@/lib/inquiries/queries";
import { today } from "@/lib/members/dates";
import { UUID_RE } from "@/lib/members/form-defaults";
import { fullName } from "@/lib/members/format";
import { listActivePlans } from "@/lib/packages/queries";

export const metadata: Metadata = {
  title: "Convert inquiry",
};

export default function ConvertInquiryPage(props: PageProps<"/inquiries/[id]/convert">) {
  return (
    <Suspense fallback={<Skeleton className="h-[40rem] w-full rounded-xl" />}>
      <ConvertInquiry params={props.params} />
    </Suspense>
  );
}

async function ConvertInquiry({ params }: { params: PageProps<"/inquiries/[id]/convert">["params"] }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const inquiry = await getInquiry(id);
  if (!inquiry) notFound();
  if (inquiry.status === "converted") {
    redirect(inquiry.convertedMemberId ? `/members/${inquiry.convertedMemberId}` : `/inquiries/${inquiry.id}`);
  }
  if (inquiry.status === "lost") redirect(`/inquiries/${inquiry.id}`);
  await connection();
  const now = today();
  const plans = await listActivePlans();
  const name = fullName(inquiry);

  return (
    <>
      <PageHeader
        eyebrow={`Inquiry #${inquiry.serialNo}`}
        title={`Enrol ${name}`}
        description="Everything captured on the inquiry is filled in below. Check it, add what is missing, and save to create the member."
      />
      <Alert className="border-brand-200 bg-brand-50 text-brand-900">
        <SparklesIcon className="text-brand-600" />
        <AlertTitle>Converting inquiry #{inquiry.serialNo}</AlertTitle>
        <AlertDescription className="text-brand-800">
          Free-check readings become the baseline follow-up and the join date defaults to today.
          {inquiry.interestedPlan ? ` The ${inquiry.interestedPlan.name} package is pre-selected.` : ""}{" "}
          <Link href={`/inquiries/${inquiry.id}`} className="font-medium underline">
            Back to the inquiry
          </Link>
        </AlertDescription>
      </Alert>
      <MemberForm
        mode="create"
        action={convertInquiry.bind(null, inquiry.id)}
        defaults={inquiryToMemberDefaults(inquiry, now)}
        today={now}
        cancelHref={`/inquiries/${inquiry.id}`}
        plans={plans}
        submitLabel="Create member"
      />
    </>
  );
}
