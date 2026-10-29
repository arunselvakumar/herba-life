import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { SparklesIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { NoAccess } from "@/components/app/no-access";
import { MemberForm } from "@/components/members/member-form";
import { PageHeader } from "@/components/members/field";
import { can } from "@/lib/access/can";
import { convertInquiry } from "@/lib/inquiries/actions";
import { inquiryToMemberDefaults } from "@/lib/inquiries/form-defaults";
import { getInquiry } from "@/lib/inquiries/queries";
import { today } from "@/lib/members/dates";
import { UUID_RE } from "@/lib/members/form-defaults";
import { fullName } from "@/lib/members/format";
import { listActivePlans } from "@/lib/packages/queries";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Convert enquiry",
};

export default function ConvertInquiryPage(props: PageProps<"/inquiries/[id]/convert">) {
  return (
    <Suspense fallback={<Skeleton className="h-[40rem] w-full rounded-3xl" />}>
      <ConvertInquiry params={props.params} />
    </Suspense>
  );
}

async function ConvertInquiry({ params }: { params: PageProps<"/inquiries/[id]/convert">["params"] }) {
  // Converting creates a member, so both permissions are needed; name the missing one.
  const user = await getCurrentUser();
  if (!can(user, "inquiries.convert")) return <NoAccess permission="inquiries.convert" />;
  if (!can(user, "members.create")) return <NoAccess permission="members.create" />;
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
        eyebrow={`Enquiry #${inquiry.serialNo}`}
        title={`Enrol ${name}`}
        description="Everything captured on the enquiry is filled in below. Check it, add what is missing, and save to create the member."
      />
      <Alert className="border-brand-200 bg-brand-50 text-brand-900">
        <SparklesIcon className="text-foreground" />
        <AlertTitle>Converting enquiry #{inquiry.serialNo}</AlertTitle>
        <AlertDescription className="text-brand-800">
          Free-check readings become the baseline follow-up and the join date defaults to today.
          {inquiry.interestedPlan ? ` The ${inquiry.interestedPlan.name} package is pre-selected.` : ""}{" "}
          <Link href={`/inquiries/${inquiry.id}`} className="font-medium underline">
            Back to the enquiry
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
