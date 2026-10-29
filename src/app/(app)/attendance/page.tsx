import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { CalendarCheckIcon, CalendarRangeIcon, SunMoonIcon, UserRoundXIcon } from "lucide-react";
import { NoAccess } from "@/components/app/no-access";
import { AttendanceModeButton } from "@/components/attendance/attendance-mode-button";
import { HourChart, VisitsChart, WeekdayChart } from "@/components/attendance/charts";
import { DayLog } from "@/components/attendance/day-log";
import { DayNav } from "@/components/attendance/day-nav";
import { MemberAvatar } from "@/components/attendance/member-avatar";
import { RecordAttendanceDialog } from "@/components/attendance/record-attendance-dialog";
import { StatCard, type Stat } from "@/components/dashboard/stat-card";
import { PageHeader, PageHeaderSkeleton } from "@/components/members/field";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { can } from "@/lib/access/can";
import { DEFAULT_RANGE, NOT_SEEN_AFTER_DAYS, RANGES, type Range } from "@/lib/attendance/constants";
import { getAttendanceDashboard, listMemberOptions } from "@/lib/attendance/queries";
import { formatMonth, formatShortDay, relativeDay } from "@/lib/attendance/time";
import { formatDay, today } from "@/lib/members/dates";
import { fullName } from "@/lib/members/format";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Attendance",
};

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRange(value: unknown): value is Range {
  return RANGES.some((r) => r.value === value);
}

export default function AttendancePage(props: PageProps<"/attendance">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeaderSkeleton />
          <OverviewSkeleton />
        </>
      }
    >
      <Attendance searchParams={props.searchParams} />
    </Suspense>
  );
}

/** Checks the role first so the header's buttons match what the person may do. */
async function Attendance({ searchParams }: { searchParams: PageProps<"/attendance">["searchParams"] }) {
  const user = await getCurrentUser();
  if (!can(user, "attendance.view")) return <NoAccess permission="attendance.view" />;
  const canRecord = can(user, "attendance.record");
  const canOpenKiosk = can(user, "attendance.kiosk");
  const canDelete = can(user, "attendance.delete");

  return (
    <>
      <PageHeader
        eyebrow="Attendance"
        title="Attendance"
        description="Who came in for their shake, and how often. Members check themselves in from Attendance Mode on the tablet."
        actions={
          canRecord || canOpenKiosk ? (
            <>
              {canRecord ? (
                <Suspense fallback={<Skeleton className="h-9 w-32" />}>
                  <RecordVisit searchParams={searchParams} />
                </Suspense>
              ) : null}
              {canOpenKiosk ? <AttendanceModeButton /> : null}
            </>
          ) : undefined
        }
      />
      <Suspense fallback={<OverviewSkeleton />}>
        <Overview searchParams={searchParams} canDelete={canDelete} />
      </Suspense>
    </>
  );
}

async function readParams(searchParams: PageProps<"/attendance">["searchParams"], now: string) {
  const params = await searchParams;
  const day = typeof params.day === "string" && DAY_RE.test(params.day) && params.day <= now ? params.day : now;
  const range: Range = isRange(params.range) ? params.range : DEFAULT_RANGE;
  return { day, range };
}

async function RecordVisit({ searchParams }: { searchParams: PageProps<"/attendance">["searchParams"] }) {
  await connection();
  const now = today();
  const [{ day }, members] = await Promise.all([readParams(searchParams, now), listMemberOptions()]);
  return <RecordAttendanceDialog members={members} day={day} today={now} />;
}

async function Overview({
  searchParams,
  canDelete,
}: {
  searchParams: PageProps<"/attendance">["searchParams"];
  canDelete: boolean;
}) {
  await connection();
  const now = today();
  const { day, range } = await readParams(searchParams, now);
  const data = await getAttendanceDashboard(day, range, now);
  const spec = RANGES.find((r) => r.value === range) ?? RANGES[1];
  const dayLabel = relativeDay(day, now);
  const monthName = formatMonth(day.slice(0, 7));

  const stats: Stat[] = [
    {
      id: "visits",
      label: `Check-ins ${dayLabel === "Today" || dayLabel === "Yesterday" ? dayLabel.toLowerCase() : `on ${dayLabel}`}`,
      value: data.today.visits,
      hint: `${data.today.members} member${data.today.members === 1 ? "" : "s"} · ${data.yesterday.visits} the day before`,
      icon: CalendarCheckIcon,
      tone: "brand",
    },
    {
      id: "periods",
      label: "Morning · afternoon · evening",
      value: `${data.today.byPeriod.morning} · ${data.today.byPeriod.afternoon} · ${data.today.byPeriod.evening}`,
      hint: "when people came in",
      icon: SunMoonIcon,
    },
    {
      id: "month",
      label: `${monthName.replace(/ \d+$/, "")} so far`,
      value: data.month.visits,
      hint: `${data.month.members} members · ${data.month.perDay} per open day`,
      icon: CalendarRangeIcon,
      tone: "brand",
    },
    {
      id: "not-seen",
      label: "Not seen lately",
      value: data.notSeen.length,
      hint: `on a package, no visit in ${NOT_SEEN_AFTER_DAYS}+ days`,
      icon: UserRoundXIcon,
      tone: data.notSeen.length > 0 ? "warning" : "default",
    },
  ];

  return (
    <>
      <DayNav day={day} today={now} range={range} />

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Check-ins over time</CardTitle>
          <CardDescription>
            {spec.unit === "month"
              ? `Monthly totals for the 12 months to ${formatMonth(day.slice(0, 7))}`
              : `Each day from ${formatShortDay(data.rangeFrom)} to ${formatShortDay(data.rangeTo)}`}
          </CardDescription>
          <CardAction>
            <nav aria-label="Chart range" className="flex flex-wrap gap-1.5">
              {RANGES.map((r) => {
                const active = r.value === range;
                const query: Record<string, string> = {};
                if (day !== now) query.day = day;
                if (r.value !== DEFAULT_RANGE) query.range = r.value;
                return (
                  <Link
                    key={r.value}
                    href={{ pathname: "/attendance", query }}
                    className={cn(
                      "inline-flex h-8 items-center rounded-full px-3 text-[0.8rem] font-semibold ring-1 transition-[background-color,color,box-shadow] duration-200",
                      active ? "bg-primary text-primary-foreground ring-primary" : "bg-card text-muted-foreground ring-border hover:text-foreground hover:ring-foreground/30",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {r.label}
                  </Link>
                );
              })}
            </nav>
          </CardAction>
        </CardHeader>
        <CardContent>
          <VisitsChart series={data.series} unit={spec.unit} selectedKey={day} />
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">Busy hours</CardTitle>
            <CardDescription>Check-ins by hour of the day over the last {spec.label.toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            <HourChart byHour={data.byHour} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">By weekday</CardTitle>
            <CardDescription>Which days of the week bring people in</CardDescription>
          </CardHeader>
          <CardContent>
            <WeekdayChart byWeekday={data.byWeekday} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">Regulars</CardTitle>
            <CardDescription>Most visits in the last {spec.label.toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {data.regulars.length === 0 ? (
              <EmptyRow>No check-ins in this period yet.</EmptyRow>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Member</TableHead>
                    <TableHead className="text-right">Visits</TableHead>
                    <TableHead className="pr-4 text-right">Last visit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.regulars.map((r) => (
                    <TableRow key={r.member.id}>
                      <TableCell className="pl-4">
                        <Link href={`/members/${r.member.id}`} className="flex items-center gap-2.5 font-medium hover:underline">
                          <MemberAvatar member={r.member} className="size-8 text-xs" />
                          {fullName(r.member)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{r.visits}</TableCell>
                      <TableCell className="pr-4 text-right text-muted-foreground">{relativeDay(r.lastDay, now)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">Not seen lately</CardTitle>
            <CardDescription>On an active package but no visit in {NOT_SEEN_AFTER_DAYS} days or more. Worth a call.</CardDescription>
            <CardAction>
              <Button asChild variant="outline" size="sm">
                <Link href={{ pathname: "/members", query: { filter: "active" } }}>All on a package</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            {data.notSeen.length === 0 ? (
              <EmptyRow>Everyone on a package has been in recently.</EmptyRow>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Member</TableHead>
                    <TableHead className="hidden sm:table-cell">Package</TableHead>
                    <TableHead className="pr-4 text-right">Last visit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.notSeen.slice(0, 8).map((r) => (
                    <TableRow key={r.member.id}>
                      <TableCell className="pl-4">
                        <Link href={`/members/${r.member.id}`} className="font-medium hover:underline">
                          {fullName(r.member)}
                        </Link>
                        <div className="text-xs text-muted-foreground">{r.member.mobile ?? "No mobile"}</div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">{r.packageName}</TableCell>
                      <TableCell className="pr-4 text-right text-muted-foreground">
                        {r.lastDay ? `${r.daysSince} days ago` : "Never"}
                        {r.lastDay ? <div className="text-xs">{formatDay(r.lastDay)}</div> : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {data.notSeen.length > 8 ? (
              <p className="px-4 pt-3 text-xs text-muted-foreground">and {data.notSeen.length - 8} more</p>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <DayLog rows={data.log} day={day} today={now} canDelete={canDelete} />
    </>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

function OverviewSkeleton() {
  return (
    <>
      <Skeleton className="h-9 w-80" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-3xl" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    </>
  );
}
