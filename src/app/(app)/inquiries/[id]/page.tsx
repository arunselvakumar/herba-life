import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  CakeIcon,
  ClockIcon,
  HeartPulseIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  RotateCcwIcon,
  ScaleIcon,
  TargetIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UserRoundCheckIcon,
  UserRoundIcon,
  UtensilsIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityForm } from "@/components/inquiries/activity-form";
import { ActivityList } from "@/components/inquiries/activity-list";
import { FollowUpDue, InquiryStatusBadge } from "@/components/inquiries/inquiry-badges";
import { MarkLostDialog } from "@/components/inquiries/mark-lost-dialog";
import { ConfirmAction } from "@/components/members/confirm-action";
import { PageHeader } from "@/components/members/field";
import { MeasurementValue } from "@/components/members/measurement-value";
import { addActivity, deleteInquiry, markLost, reopenInquiry } from "@/lib/inquiries/actions";
import { isOpenStatus } from "@/lib/inquiries/constants";
import { goalLabels, sourceLabel } from "@/lib/inquiries/format";
import { findMembersByMobile, getInquiry, type InquiryDetail } from "@/lib/inquiries/queries";
import { DIETS, GENDERS, MEASUREMENTS, PAIN_AREAS, SYMPTOMS } from "@/lib/members/constants";
import { formatDay, today } from "@/lib/members/dates";
import { UUID_RE } from "@/lib/members/form-defaults";
import { displayAge, formatMoney, formatNumber, fullName, rangeVerdict } from "@/lib/members/format";

export const metadata: Metadata = {
  title: "Inquiry",
};

export default function InquiryPage(props: PageProps<"/inquiries/[id]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <InquiryDetailView params={props.params} />
    </Suspense>
  );
}

async function InquiryDetailView({ params }: { params: PageProps<"/inquiries/[id]">["params"] }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const inquiry = await getInquiry(id);
  if (!inquiry) notFound();

  await connection();
  const now = today();
  const name = fullName(inquiry);
  const open = isOpenStatus(inquiry.status);
  const age = displayAge(inquiry);
  const gender = GENDERS.find((g) => g.value === inquiry.gender)?.label;
  const possibleMatches = open ? await findMembersByMobile(inquiry.mobile) : [];

  return (
    <>
      <PageHeader
        eyebrow={`Inquiry #${inquiry.serialNo}`}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {name}
            <InquiryStatusBadge status={inquiry.status} className="translate-y-0.5 text-sm" />
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {gender ? <span>{gender}</span> : null}
            {age !== null ? <span>{age} years</span> : null}
            <span>
              {sourceLabel(inquiry.source)} · {formatDay(inquiry.inquiredOn)}
            </span>
            {inquiry.referredBy || inquiry.referredByMember ? (
              <span>
                Referred by{" "}
                {inquiry.referredByMember ? (
                  <Link href={`/members/${inquiry.referredByMember.id}`} className="font-medium hover:underline">
                    {fullName(inquiry.referredByMember)}
                  </Link>
                ) : (
                  inquiry.referredBy
                )}
              </span>
            ) : null}
          </span>
        }
        actions={
          <>
            {open ? (
              <>
                <Button asChild size="lg">
                  <Link href={`/inquiries/${inquiry.id}/convert`}>
                    <UserRoundCheckIcon data-icon="inline-start" />
                    Convert to member
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href={`/inquiries/${inquiry.id}/edit`}>
                    <PencilIcon data-icon="inline-start" />
                    Edit
                  </Link>
                </Button>
                <MarkLostDialog action={markLost.bind(null, inquiry.id)} name={name} />
              </>
            ) : null}
            {inquiry.status === "lost" ? (
              <ConfirmAction
                action={reopenInquiry.bind(null, inquiry.id)}
                title={`Reopen ${name}?`}
                description="It goes back to “In progress” so you can keep following up."
                confirmLabel="Reopen"
                variant="outline"
                size="lg"
              >
                <RotateCcwIcon data-icon="inline-start" />
                Reopen
              </ConfirmAction>
            ) : null}
            <ConfirmAction
              action={deleteInquiry.bind(null, inquiry.id)}
              title={`Delete ${name}?`}
              description={
                inquiry.convertedMember
                  ? "This removes the inquiry and its follow-up log. The member record stays."
                  : "This permanently removes the inquiry and its follow-up log."
              }
              confirmLabel="Delete inquiry"
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

      {inquiry.status === "converted" ? (
        <Alert className="border-brand-200 bg-brand-50 text-brand-900">
          <UserRoundCheckIcon className="text-brand-600" />
          <AlertTitle>Converted to a member{inquiry.closedAt ? ` on ${formatDay(toDay(inquiry.closedAt))}` : ""}</AlertTitle>
          <AlertDescription className="text-brand-800">
            {inquiry.convertedMember ? (
              <Link href={`/members/${inquiry.convertedMember.id}`} className="font-medium underline">
                Open member #{inquiry.convertedMember.serialNo} · {fullName(inquiry.convertedMember)}
              </Link>
            ) : (
              "The member record has since been deleted."
            )}
          </AlertDescription>
        </Alert>
      ) : null}

      {inquiry.status === "lost" ? (
        <Alert>
          <TriangleAlertIcon />
          <AlertTitle>Marked lost{inquiry.closedAt ? ` on ${formatDay(toDay(inquiry.closedAt))}` : ""}</AlertTitle>
          <AlertDescription>{inquiry.lostReason ?? "No reason recorded."}</AlertDescription>
        </Alert>
      ) : null}

      {possibleMatches.length > 0 ? (
        <Alert className="border-warning/60 bg-warning/10">
          <TriangleAlertIcon className="text-amber-700" />
          <AlertTitle>Possibly an existing member</AlertTitle>
          <AlertDescription>
            <span>
              The same mobile number belongs to{" "}
              {possibleMatches.map((m, i) => (
                <span key={m.id}>
                  {i > 0 ? ", " : ""}
                  <Link href={`/members/${m.id}`} className="font-medium underline">
                    #{m.serialNo} {fullName(m)}
                  </Link>
                </span>
              ))}
              . If this is a renewal, add a package on the member&rsquo;s profile instead of converting.
            </span>
          </AlertDescription>
        </Alert>
      ) : null}

      <section aria-label="Status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="ring-stone/80">
          <CardHeader>
            <CardDescription className="text-eyebrow text-[0.65rem]">Next follow-up</CardDescription>
            <CardTitle className="text-lg font-bold">
              {open ? <FollowUpDue nextFollowUpOn={inquiry.nextFollowUpOn} today={now} className="text-lg" /> : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {open ? "Log a follow-up below to move it." : "Closed inquiries have no reminders."}
          </CardContent>
        </Card>
        <Card className="ring-stone/80">
          <CardHeader>
            <CardDescription className="text-eyebrow text-[0.65rem]">Assigned to</CardDescription>
            <CardTitle className="text-lg font-bold">{inquiry.assignedUser?.name ?? "Unassigned"}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Recorded by {inquiry.createdByUser?.name ?? "—"}
          </CardContent>
        </Card>
        <Card className="ring-stone/80">
          <CardHeader>
            <CardDescription className="text-eyebrow text-[0.65rem]">Interested in</CardDescription>
            <CardTitle className="text-lg font-bold">{inquiry.interestedPlan?.name ?? "Not decided"}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {inquiry.interestedPlan
              ? `${inquiry.interestedPlan.durationDays} days · ${formatMoney(inquiry.interestedPlan.price)}${inquiry.interestedPlan.isActive ? "" : " · archived"}`
              : "No package picked yet."}
          </CardContent>
        </Card>
        <Card className="ring-stone/80">
          <CardHeader>
            <CardDescription className="text-eyebrow text-[0.65rem]">Follow-ups</CardDescription>
            <CardTitle className="font-heading text-2xl font-extrabold tracking-tight tabular-nums">
              {inquiry.activities.filter((a) => a.type !== "status").length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {inquiry.activities[0] ? `Last on ${formatDay(inquiry.activities[0].occurredOn)}` : "None logged yet"}
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <div className="min-w-0 space-y-6">
          {open ? <ActivityForm action={addActivity.bind(null, inquiry.id)} today={now} nextFollowUpOn={inquiry.nextFollowUpOn} /> : null}
          <ActivityList inquiryId={inquiry.id} activities={inquiry.activities} />
          <ReadingsCard inquiry={inquiry} />
        </div>
        <div className="min-w-0 space-y-6">
          <GoalsCard inquiry={inquiry} />
          <ContactCard inquiry={inquiry} />
          <HealthCard inquiry={inquiry} />
          <EatingHabitsCard inquiry={inquiry} />
          {inquiry.remarks ? (
            <Card className="ring-stone/80">
              <CardHeader>
                <CardTitle className="text-base font-bold">Remarks</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">{inquiry.remarks}</CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

function toDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

function GoalsCard({ inquiry }: { inquiry: InquiryDetail }) {
  const goals = goalLabels(inquiry.goals);
  return (
    <Card className="ring-stone/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <TargetIcon className="size-4 text-brand-600" />
          What they want
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {goals.length === 0 && !inquiry.goalNotes ? <p className="text-muted-foreground">Not recorded.</p> : null}
        {goals.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {goals.map((g) => (
              <Badge key={g} className="rounded-full border-transparent bg-brand-100 font-semibold text-brand-700">
                {g}
              </Badge>
            ))}
          </div>
        ) : null}
        {inquiry.goalNotes ? <p className="whitespace-pre-wrap text-muted-foreground">{inquiry.goalNotes}</p> : null}
      </CardContent>
    </Card>
  );
}

function ContactCard({ inquiry }: { inquiry: InquiryDetail }) {
  return (
    <Card className="ring-stone/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <UserRoundIcon className="size-4 text-brand-600" />
          Contact
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2">
          <div className="flex flex-col gap-2 text-sm">
            {inquiry.mobile ? (
              <a href={`tel:${inquiry.mobile}`} className="flex items-center gap-2 hover:underline">
                <PhoneIcon className="size-4 text-muted-foreground" />
                {inquiry.mobile}
              </a>
            ) : null}
            {inquiry.email ? (
              <a href={`mailto:${inquiry.email}`} className="flex items-center gap-2 break-all hover:underline">
                <MailIcon className="size-4 shrink-0 text-muted-foreground" />
                {inquiry.email}
              </a>
            ) : null}
            {inquiry.preferredContactTime ? (
              <p className="flex items-center gap-2">
                <ClockIcon className="size-4 text-muted-foreground" />
                {inquiry.preferredContactTime}
              </p>
            ) : null}
            {inquiry.address ? (
              <p className="flex items-start gap-2">
                <MapPinIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="whitespace-pre-wrap">{inquiry.address}</span>
              </p>
            ) : null}
            {inquiry.dateOfBirth ? (
              <p className="flex items-center gap-2">
                <CakeIcon className="size-4 text-muted-foreground" />
                Born {formatDay(inquiry.dateOfBirth)}
              </p>
            ) : null}
            {!inquiry.mobile && !inquiry.email && !inquiry.address ? <p className="text-muted-foreground">No contact details yet.</p> : null}
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

function ReadingsCard({ inquiry }: { inquiry: InquiryDetail }) {
  const hasAny = inquiry.heightCm !== null || MEASUREMENTS.some((m) => inquiry[m.key] !== null);
  return (
    <Card className="ring-stone/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <ScaleIcon className="size-4 text-brand-600" />
          Free check readings
        </CardTitle>
        <CardDescription>Becomes the baseline follow-up when they join.</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasAny ? (
          <p className="text-sm text-muted-foreground">No readings taken.</p>
        ) : (
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
            <div>
              <dt className="text-eyebrow text-[0.65rem] text-muted-foreground">Height</dt>
              <dd className="text-lg font-semibold tabular-nums">{inquiry.heightCm !== null ? `${formatNumber(inquiry.heightCm)} cm` : "—"}</dd>
            </div>
            {MEASUREMENTS.map((m) => (
              <div key={m.key}>
                <dt className="text-eyebrow text-[0.65rem] text-muted-foreground">{m.label}</dt>
                <dd className="text-lg font-semibold">
                  <MeasurementValue
                    value={inquiry[m.key]}
                    verdict={rangeVerdict(m.key, inquiry[m.key], inquiry.gender)}
                    unit={m.unit}
                    digits={m.step === "1" ? 0 : 1}
                  />
                </dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

function HealthCard({ inquiry }: { inquiry: InquiryDetail }) {
  const conditions = [
    inquiry.hasBloodPressure ? "Blood pressure" : null,
    inquiry.hasSugar ? "Sugar" : null,
    inquiry.hasCardiac ? "Cardiac" : null,
  ].filter((c): c is string => c !== null);
  const symptoms = SYMPTOMS.filter((s) => inquiry.symptoms.includes(s.value));
  const painAreas = PAIN_AREAS.filter((p) => inquiry.painAreas.includes(p.value));
  const empty = conditions.length === 0 && symptoms.length === 0 && !inquiry.medicines && !inquiry.healthNotes;

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
          <DetailRow label="Medicine" value={inquiry.medicines} />
          <DetailRow label="Notes" value={inquiry.healthNotes} />
        </dl>
      </CardContent>
    </Card>
  );
}

function EatingHabitsCard({ inquiry }: { inquiry: InquiryDetail }) {
  const diet = DIETS.find((d) => d.value === inquiry.diet)?.label;
  const rows: [string, string | null][] = [
    ["Wake up", inquiry.wakeUpTime],
    ["Tea / coffee", inquiry.teaCoffee],
    ["Breakfast", inquiry.breakfast],
    ["Lunch", inquiry.lunch],
    ["Eve. snacks", inquiry.eveningSnacks],
    ["Dinner", inquiry.dinner],
    ["Diet", diet ?? null],
    ["Water", inquiry.waterIntake],
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

function DetailSkeleton() {
  return (
    <>
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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
