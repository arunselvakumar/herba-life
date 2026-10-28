import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  CakeIcon,
  HeartPulseIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  Trash2Icon,
  UserRoundIcon,
  UtensilsIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckinForm } from "@/components/members/checkin-form";
import { CheckinHistory } from "@/components/members/checkin-history";
import { ConfirmAction } from "@/components/members/confirm-action";
import { PageHeader } from "@/components/members/field";
import { Delta, MeasurementValue } from "@/components/members/measurement-value";
import { PackageBadge } from "@/components/members/package-badge";
import { PackageList } from "@/components/members/package-list";
import { WeightTrend } from "@/components/members/weight-trend";
import { AttendanceSummary } from "@/components/attendance/member-summary";
import { addCheckin, deleteMember } from "@/lib/members/actions";
import { DIETS, EXPIRING_SOON_DAYS, GENDERS, MEASUREMENTS, PAIN_AREAS, SYMPTOMS } from "@/lib/members/constants";
import { formatDay, today } from "@/lib/members/dates";
import { UUID_RE } from "@/lib/members/form-defaults";
import { daysLeft, displayAge, formatNumber, fullName, packageState, rangeVerdict } from "@/lib/members/format";
import { getMember, type MemberDetail } from "@/lib/members/queries";
import { sourceLabel } from "@/lib/inquiries/format";
import { getSourceInquiry } from "@/lib/inquiries/queries";

export const metadata: Metadata = {
  title: "Member",
};

export default function MemberPage(props: PageProps<"/members/[id]">) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <MemberProfile params={props.params} />
    </Suspense>
  );
}

async function MemberProfile({ params }: { params: PageProps<"/members/[id]">["params"] }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const member = await getMember(id);
  if (!member) notFound();

  await connection();
  const now = today();
  const name = fullName(member);
  const age = displayAge(member);
  const gender = GENDERS.find((g) => g.value === member.gender)?.label;
  const currentPackage =
    member.packages.find((p) => p.status === "active" && p.startDate <= now && p.endDate >= now) ??
    member.packages.find((p) => p.status === "active") ??
    null;
  const currentState = currentPackage ? packageState(currentPackage, EXPIRING_SOON_DAYS, now) : null;
  const latest = member.checkins[0] ?? null;
  const baseline = member.checkins[member.checkins.length - 1] ?? null;
  const sourceInquiry = await getSourceInquiry(member.id);

  return (
    <>
      <PageHeader
        eyebrow={`Member #${member.serialNo}`}
        title={name}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {gender ? <span>{gender}</span> : null}
            {age !== null ? <span>{age} years</span> : null}
            <span>Joined {formatDay(member.joinedOn)}</span>
            {member.referredBy ? <span>Referred by {member.referredBy}</span> : null}
          </span>
        }
        actions={
          <>
            <Button asChild variant="outline" size="lg">
              <Link href={`/members/${member.id}/edit`}>
                <PencilIcon data-icon="inline-start" />
                Edit details
              </Link>
            </Button>
            <ConfirmAction
              action={deleteMember.bind(null, member.id)}
              title={`Delete ${name}?`}
              description="This permanently removes the member along with all packages and follow-ups."
              confirmLabel="Delete member"
              destructive
              variant="outline"
              size="lg"
              className="text-destructive"
            >
              <Trash2Icon data-icon="inline-start" />
              Delete
            </ConfirmAction>
          </>
        }
      />

      <section aria-label="Current status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="ring-stone/80 sm:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardDescription className="text-eyebrow text-[0.65rem]">Package</CardDescription>
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg font-bold">
              {currentPackage ? currentPackage.name : "None"}
              <PackageBadge state={currentState} />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {currentPackage
              ? currentState === "upcoming"
                ? `Starts ${formatDay(currentPackage.startDate)}`
                : daysLeft(currentPackage, now) >= 0
                  ? `${daysLeft(currentPackage, now)} days left · until ${formatDay(currentPackage.endDate)}`
                  : `Ended ${formatDay(currentPackage.endDate)}`
              : "Add a package to start tracking the programme."}
          </CardContent>
        </Card>
        {MEASUREMENTS.filter((m) => ["weightKg", "bodyFatPct", "bmi", "waistCm"].includes(m.key)).map((m) => (
          <Card key={m.key} className="ring-stone/80">
            <CardHeader>
              <CardDescription className="text-eyebrow text-[0.65rem]">{m.label}</CardDescription>
              <CardTitle className="font-heading text-2xl font-extrabold tracking-tight">
                <MeasurementValue
                  value={latest?.[m.key]}
                  verdict={rangeVerdict(m.key, latest?.[m.key], member.gender)}
                  unit={m.unit}
                  digits={m.step === "1" ? 0 : 1}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {latest && baseline && latest.id !== baseline.id ? (
                <>
                  Since enrolment
                  <Delta current={latest[m.key]} previous={baseline[m.key]} />
                </>
              ) : m.hint ? (
                `Ref ${m.hint}`
              ) : latest ? (
                `Recorded ${formatDay(latest.recordedOn)}`
              ) : (
                "Not recorded yet"
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <div className="min-w-0 space-y-6">
          <CheckinForm action={addCheckin.bind(null, member.id)} today={now} heightCm={member.heightCm} />
          <WeightTrend checkins={member.checkins} />
          <CheckinHistory member={member} />
        </div>
        <div className="min-w-0 space-y-6">
          <PackageList memberId={member.id} packages={member.packages} today={now} />
          <AttendanceSummary memberId={member.id} today={now} />
          <ContactCard member={member} sourceInquiry={sourceInquiry} />
          <HealthCard member={member} />
          <EatingHabitsCard member={member} />
          {member.remarks ? (
            <Card className="ring-stone/80">
              <CardHeader>
                <CardTitle className="text-base font-bold">Remarks</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">{member.remarks}</CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </div>
  );
}

function ContactCard({
  member,
  sourceInquiry,
}: {
  member: MemberDetail;
  sourceInquiry: { id: string; serialNo: number; inquiredOn: string; source: Parameters<typeof sourceLabel>[0] } | null;
}) {
  return (
    <Card className="ring-stone/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <UserRoundIcon className="size-4 text-brand-600" />
          Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2">
          <div className="flex flex-col gap-2 text-sm">
            {member.mobile ? (
              <a href={`tel:${member.mobile}`} className="flex items-center gap-2 hover:underline">
                <PhoneIcon className="size-4 text-muted-foreground" />
                {member.mobile}
              </a>
            ) : null}
            {member.email ? (
              <a href={`mailto:${member.email}`} className="flex items-center gap-2 break-all hover:underline">
                <MailIcon className="size-4 shrink-0 text-muted-foreground" />
                {member.email}
              </a>
            ) : null}
            {member.address ? (
              <p className="flex items-start gap-2">
                <MapPinIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="whitespace-pre-wrap">{member.address}</span>
              </p>
            ) : null}
            {member.dateOfBirth ? (
              <p className="flex items-center gap-2">
                <CakeIcon className="size-4 text-muted-foreground" />
                Born {formatDay(member.dateOfBirth)}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5 border-t pt-3">
            <DetailRow label="Height" value={member.heightCm !== null ? `${formatNumber(member.heightCm)} cm` : null} />
            <DetailRow label="Referred by" value={member.referredBy} />
            <DetailRow label="Added by" value={member.createdByUser?.name} />
            {sourceInquiry ? (
              <div className="grid grid-cols-[7rem_1fr] gap-2 text-sm">
                <dt className="text-muted-foreground">Came from</dt>
                <dd className="min-w-0">
                  <Link href={`/inquiries/${sourceInquiry.id}`} className="hover:underline">
                    Inquiry #{sourceInquiry.serialNo}
                  </Link>
                  <span className="text-muted-foreground">
                    {" "}
                    · {sourceLabel(sourceInquiry.source)}, {formatDay(sourceInquiry.inquiredOn)}
                  </span>
                </dd>
              </div>
            ) : null}
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

function HealthCard({ member }: { member: MemberDetail }) {
  const conditions = [
    member.hasBloodPressure ? "Blood pressure" : null,
    member.hasSugar ? "Sugar" : null,
    member.hasCardiac ? "Cardiac" : null,
  ].filter((c): c is string => c !== null);
  const symptoms = SYMPTOMS.filter((s) => member.symptoms.includes(s.value));
  const painAreas = PAIN_AREAS.filter((p) => member.painAreas.includes(p.value));
  const empty = conditions.length === 0 && symptoms.length === 0 && !member.medicines && !member.healthNotes;

  return (
    <Card className="ring-stone/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <HeartPulseIcon className="size-4 text-brand-600" />
          Health condition
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {empty ? <p className="text-muted-foreground">Nothing reported.</p> : null}
        {conditions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {conditions.map((c) => (
              <Badge key={c} className="rounded-full border-transparent bg-destructive/10 font-semibold text-destructive">
                {c}
              </Badge>
            ))}
          </div>
        ) : null}
        {symptoms.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {symptoms.map((s) => (
              <Badge key={s.value} variant="outline" className="rounded-full">
                {s.label}
                {s.value === "pain" && painAreas.length > 0 ? `: ${painAreas.map((p) => p.label).join(", ")}` : ""}
              </Badge>
            ))}
          </div>
        ) : null}
        <dl className="space-y-1.5">
          <DetailRow label="Medicine" value={member.medicines} />
          <DetailRow label="Notes" value={member.healthNotes} />
        </dl>
      </CardContent>
    </Card>
  );
}

function EatingHabitsCard({ member }: { member: MemberDetail }) {
  const diet = DIETS.find((d) => d.value === member.diet)?.label;
  const rows: [string, string | null][] = [
    ["Wake up", member.wakeUpTime],
    ["Tea / coffee", member.teaCoffee],
    ["Breakfast", member.breakfast],
    ["Lunch", member.lunch],
    ["Eve. snacks", member.eveningSnacks],
    ["Dinner", member.dinner],
    ["Diet", diet ?? null],
    ["Water", member.waterIntake],
  ];
  const empty = rows.every(([, v]) => !v);
  return (
    <Card className="ring-stone/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <UtensilsIcon className="size-4 text-brand-600" />
          Eating habits
        </CardTitle>
      </CardHeader>
      <CardContent>
        {empty ? (
          <p className="text-sm text-muted-foreground">Not recorded.</p>
        ) : (
          <dl className="space-y-1.5">
            {rows.map(([label, value]) => (
              <DetailRow key={label} label={label} value={value} />
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

function ProfileSkeleton() {
  return (
    <>
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </>
  );
}
