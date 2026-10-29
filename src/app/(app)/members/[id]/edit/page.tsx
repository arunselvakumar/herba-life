import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { NoAccess } from "@/components/app/no-access";
import { MemberForm } from "@/components/members/member-form";
import { PageHeader } from "@/components/members/field";
import { can } from "@/lib/access/can";
import { updateMember } from "@/lib/members/actions";
import { today } from "@/lib/members/dates";
import { memberToDefaults, UUID_RE } from "@/lib/members/form-defaults";
import { fullName } from "@/lib/members/format";
import { getMember } from "@/lib/members/queries";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Edit member",
};

export default function EditMemberPage(props: PageProps<"/members/[id]/edit">) {
  return (
    <Suspense fallback={<Skeleton className="h-[40rem] w-full rounded-3xl" />}>
      <EditMember params={props.params} />
    </Suspense>
  );
}

async function EditMember({ params }: { params: PageProps<"/members/[id]/edit">["params"] }) {
  const user = await getCurrentUser();
  if (!can(user, "members.update")) return <NoAccess permission="members.update" />;
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const member = await getMember(id);
  if (!member) notFound();
  await connection();

  return (
    <>
      <PageHeader eyebrow={`Member #${member.serialNo}`} title={`Edit ${fullName(member)}`} description="Update the wellness record." />
      <MemberForm
        mode="edit"
        action={updateMember.bind(null, member.id)}
        defaults={memberToDefaults(member)}
        today={today()}
        cancelHref={`/members/${member.id}`}
      />
    </>
  );
}
