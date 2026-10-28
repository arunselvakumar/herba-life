import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  CalendarCheckIcon,
  CalendarClockIcon,
  ClipboardListIcon,
  HourglassIcon,
  MessageSquareMoreIcon,
  PackageCheckIcon,
  UserRoundPlusIcon,
  UsersRoundIcon,
} from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard, type Stat } from "@/components/dashboard/stat-card";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { GhostTitle } from "@/components/motion/ghost-title";
import { Reveal } from "@/components/motion/reveal";
import { FollowUpDue, InquiryStatusBadge } from "@/components/inquiries/inquiry-badges";
import { PackageBadge } from "@/components/members/package-badge";
import { sourceLabel } from "@/lib/inquiries/format";
import { getInquiryDashboard } from "@/lib/inquiries/queries";
import { EXPIRING_SOON_DAYS, FOLLOW_UP_INTERVAL_DAYS } from "@/lib/members/constants";
import { daysBetween, formatDay, today } from "@/lib/members/dates";
import { formatNumber, fullName } from "@/lib/members/format";
import { getDashboardData } from "@/lib/members/queries";
import { countDay } from "@/lib/attendance/queries";

export const metadata: Metadata = {
  title: "Dashboard",
};

const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" });

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

async function Greeting() {
  // The time-of-day greeting must be computed per request, never prerendered.
  await connection();
  const user = await getCurrentUser();
  const firstName = user.name.split(/\s+/)[0] ?? user.name;
  const greeting = greetingFor(new Date().getHours());

  return (
    <div className="relative z-10 space-y-1.5">
      <p className="text-eyebrow">Overview</p>
      <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] md:text-[2.5rem] md:leading-[1.1]">
        {greeting}, {firstName}.
      </h1>
      <p className="text-sm text-muted-foreground">Here is how your members are doing today.</p>
    </div>
  );
}

function GreetingSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-4 w-80" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <Reveal className="relative isolate -mx-4 -my-8 flex flex-col gap-4 overflow-hidden px-4 py-8 md:-mx-8 md:flex-row md:items-end md:justify-between md:px-8">
        <GhostTitle text="Dashboard" className="left-4 md:left-8" />
        <Suspense fallback={<GreetingSkeleton />}>
          <Greeting />
        </Suspense>
        <div className="relative z-10 flex gap-2">
          <Button asChild variant="outline" size="lg">
            <Link href="/members">
              <UsersRoundIcon data-icon="inline-start" />
              All members
            </Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/members/new">
              <UserRoundPlusIcon data-icon="inline-start" />
              New member
            </Link>
          </Button>
        </div>
      </Reveal>

      <Suspense fallback={<OverviewSkeleton />}>
        <Overview />
      </Suspense>
    </>
  );
}

async function Overview() {
  await connection();
  const now = today();
  const [data, inquiries, attendanceToday] = await Promise.all([getDashboardData(now), getInquiryDashboard(now), countDay(now)]);
  const month = monthLabel.format(new Date());

  const stats: Stat[] = [
    {
      id: "members",
      label: "Members",
      value: data.totalMembers,
      hint: `${data.newMembersThisMonth} joined in ${month}`,
      icon: UsersRoundIcon,
      tone: "brand",
      href: "/members",
    },
    {
      id: "active",
      label: "Active packages",
      value: data.activePackages,
      hint: "running today",
      icon: PackageCheckIcon,
      tone: "brand",
      href: "/members?filter=active",
      progress: {
        value: data.totalMembers > 0 ? data.activePackages / data.totalMembers : 0,
        tone: "ink",
        label: "Share of members on a package",
      },
    },
    {
      id: "expiring",
      label: "Ending soon",
      value: data.expiringSoon,
      hint: `within the next ${EXPIRING_SOON_DAYS} days`,
      icon: HourglassIcon,
      tone: data.expiringSoon > 0 ? "warning" : "default",
      href: "/members?filter=expiring",
      progress: {
        value: data.activePackages > 0 ? data.expiringSoon / data.activePackages : 0,
        tone: "leaf",
        label: "Share of active packages ending soon",
      },
    },
    {
      id: "checkins",
      label: "Follow-ups",
      value: data.checkinsThisMonth,
      hint: `recorded in ${month}`,
      icon: ClipboardListIcon,
      href: "/members?filter=due",
    },
    {
      id: "inquiries",
      label: "Open enquiries",
      value: inquiries.open,
      hint: inquiries.due > 0 ? `${inquiries.due} to follow up today` : `${inquiries.convertedThisMonth} converted in ${month}`,
      icon: MessageSquareMoreIcon,
      tone: inquiries.due > 0 ? "warning" : "default",
      href: "/inquiries",
    },
    {
      id: "attendance",
      label: "Check-ins today",
      value: attendanceToday.visits,
      hint: `${attendanceToday.members} member${attendanceToday.members === 1 ? "" : "s"} came in`,
      icon: CalendarCheckIcon,
      tone: "brand",
      href: "/attendance",
    },
  ];

  return (
    <>
      <StatGrid aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </StatGrid>

      <Reveal delay={0.15} className="grid gap-4 xl:grid-cols-2">
        <Card data-reveal>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Follow-up due</CardTitle>
            <CardDescription>On a package, but not measured in the last {FOLLOW_UP_INTERVAL_DAYS} days</CardDescription>
            <CardAction>
              <Button asChild variant="secondary" size="sm">
                <Link href={{ pathname: "/members", query: { filter: "due" } }}>View all</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            {data.followUpsDue.length === 0 ? (
              <EmptyRow>Everyone is up to date.</EmptyRow>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Member</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead className="pr-4 text-right">Last visit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.followUpsDue.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="pl-4">
                        <Link href={`/members/${c.id}`} className="font-medium hover:underline">
                          {fullName(c)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.currentPackage?.name ?? "—"}</TableCell>
                      <TableCell className="pr-4 text-right text-muted-foreground">
                        {c.latestCheckin ? `${daysBetween(c.latestCheckin.recordedOn, now)} days ago` : "Never"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card data-reveal>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Packages ending soon</CardTitle>
            <CardDescription>Time to talk about renewals</CardDescription>
            <CardAction>
              <Button asChild variant="secondary" size="sm">
                <Link href={{ pathname: "/members", query: { filter: "expiring" } }}>View all</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            {data.expiringPackages.length === 0 ? (
              <EmptyRow>No packages end in the next {EXPIRING_SOON_DAYS} days.</EmptyRow>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Member</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead className="pr-4 text-right">Ends</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.expiringPackages.map((p) => {
                    const left = daysBetween(now, p.endDate);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="pl-4">
                          <Link href={`/members/${p.member.id}`} className="font-medium hover:underline">
                            {fullName(p.member)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            {p.name}
                            <PackageBadge state="expiring" />
                          </span>
                        </TableCell>
                        <TableCell className="pr-4 text-right text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <CalendarClockIcon className="size-3.5" />
                            {left === 0 ? "Today" : `${left} days`}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Reveal>

      <Reveal delay={0.25} className="grid gap-4 xl:grid-cols-2">
        <Card data-reveal>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Enquiries to follow up</CardTitle>
            <CardDescription>Due today or overdue, plus new ones nobody has called yet</CardDescription>
            <CardAction>
              <Button asChild variant="secondary" size="sm">
                <Link href={{ pathname: "/inquiries", query: { filter: "due" } }}>View all</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            {inquiries.dueList.length === 0 ? (
              <EmptyRow>Nothing due. Every open enquiry has a future follow-up.</EmptyRow>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Person</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-4 text-right">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inquiries.dueList.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="pl-4">
                        <Link href={`/inquiries/${i.id}`} className="font-medium hover:underline">
                          {fullName(i)}
                        </Link>
                        <div className="text-xs text-muted-foreground">{i.mobile ?? sourceLabel(i.source)}</div>
                      </TableCell>
                      <TableCell>
                        <InquiryStatusBadge status={i.status} />
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <FollowUpDue nextFollowUpOn={i.nextFollowUpOn} today={now} className="text-xs" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card data-reveal>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent enquiries</CardTitle>
            <CardDescription>
              {inquiries.newThisMonth} received in {month} · {inquiries.convertedThisMonth} converted
            </CardDescription>
            <CardAction>
              <Button asChild variant="secondary" size="sm">
                <Link href="/inquiries">View all</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            {inquiries.recent.length === 0 ? (
              <EmptyRow>No open enquiries. Record one when someone asks about the programme.</EmptyRow>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Person</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="pr-4 text-right">Enquired</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inquiries.recent.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="pl-4">
                        <Link href={`/inquiries/${i.id}`} className="font-medium hover:underline">
                          {fullName(i)}
                        </Link>
                        {i.interestedPlan ? <div className="text-xs text-muted-foreground">Interested in {i.interestedPlan.name}</div> : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{sourceLabel(i.source)}</TableCell>
                      <TableCell className="pr-4 text-right text-muted-foreground">{formatDay(i.inquiredOn)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Reveal>

      <Reveal delay={0.35}>
      <Card data-reveal>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent follow-ups</CardTitle>
          <CardDescription>Latest readings recorded across all members</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {data.recentCheckins.length === 0 ? (
            <EmptyRow>No follow-ups recorded yet.</EmptyRow>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Date</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Fat %</TableHead>
                  <TableHead className="hidden text-right md:table-cell">BMI</TableHead>
                  <TableHead className="hidden lg:table-cell">Remarks</TableHead>
                  <TableHead className="hidden pr-4 md:table-cell">By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentCheckins.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="pl-4 text-muted-foreground">{formatDay(c.recordedOn)}</TableCell>
                    <TableCell>
                      <Link href={`/members/${c.member.id}`} className="font-medium hover:underline">
                        {fullName(c.member)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{c.weightKg !== null ? `${formatNumber(c.weightKg)} kg` : "—"}</TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">{formatNumber(c.bodyFatPct)}</TableCell>
                    <TableCell className="hidden text-right tabular-nums md:table-cell">{formatNumber(c.bmi)}</TableCell>
                    <TableCell className="hidden max-w-64 truncate text-muted-foreground lg:table-cell">{c.remarks ?? ""}</TableCell>
                    <TableCell className="hidden pr-4 text-muted-foreground md:table-cell">{c.recordedByUser?.name ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </Reveal>
    </>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

function OverviewSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    </>
  );
}
