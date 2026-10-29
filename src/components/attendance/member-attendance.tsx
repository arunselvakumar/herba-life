import Link from "next/link";
import { ArrowUpRightIcon, CalendarCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMemberCalendar } from "@/lib/attendance/calendar";
import { formatTime, relativeDay } from "@/lib/attendance/time";
import { formatDay } from "@/lib/members/dates";
import { MemberCalendar } from "./member-calendar";

function describeDay(day: string, today: string): string {
  const relative = relativeDay(day, today);
  if (relative === "Today" || relative === "Yesterday") return relative.toLowerCase();
  return `on ${formatDay(day)}`;
}

/**
 * The member profile's attendance card: visits this month and all time, the
 * last visit, and the month-by-month calendar underneath.
 */
export async function MemberAttendance({ memberId, today, joinedOn }: { memberId: string; today: string; joinedOn: string }) {
  const data = await getMemberCalendar(memberId, today, joinedOn);
  const last = data.last;
  const current = data.months[data.months.length - 1];
  const daysThisMonth = current ? Object.keys(current.days).length : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <CalendarCheckIcon className="size-4 text-foreground" />
          Attendance
        </CardTitle>
        <CardDescription>
          {last ? <>Last visit {describeDay(last.day, today)} at {formatTime(last.checkedInAt)}</> : "Has not checked in yet."}
        </CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href={{ pathname: "/attendance", query: last ? { day: last.day } : {} }}>
              Open attendance
              <ArrowUpRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <dt className="text-eyebrow">This month</dt>
            <dd className="font-heading text-2xl font-semibold tabular-nums">{data.thisMonth}</dd>
          </div>
          <div>
            <dt className="text-eyebrow">All time</dt>
            <dd className="font-heading text-2xl font-semibold tabular-nums">{data.total}</dd>
          </div>
          <div>
            <dt className="text-eyebrow">Days this month</dt>
            <dd className="font-heading text-2xl font-semibold tabular-nums">{daysThisMonth}</dd>
          </div>
        </dl>
        <MemberCalendar memberId={memberId} initialMonths={data.months} initialHasMore={data.hasMore} today={today} joinedOn={joinedOn} />
      </CardContent>
    </Card>
  );
}
