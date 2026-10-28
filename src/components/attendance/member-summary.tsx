import Link from "next/link";
import { CalendarCheckIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMemberAttendanceSummary } from "@/lib/attendance/queries";
import { formatTime, relativeDay } from "@/lib/attendance/time";
import { formatDay } from "@/lib/members/dates";
import { cn } from "@/lib/utils";

function describeDay(day: string, today: string): string {
  const relative = relativeDay(day, today);
  if (relative === "Today" || relative === "Yesterday") return relative.toLowerCase();
  return `on ${formatDay(day)}`;
}

/**
 * Attendance at a glance on the member profile: visits this month, the last
 * visit, and a four-week strip showing which days they came in.
 */
export async function AttendanceSummary({ memberId, today }: { memberId: string; today: string }) {
  const summary = await getMemberAttendanceSummary(memberId, today);
  const last = summary.last;

  return (
    <Card className="ring-stone/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <CalendarCheckIcon className="size-4 text-brand-600" />
          Attendance
        </CardTitle>
        <CardDescription>
          {last ? (
            <>
              Last visit {describeDay(last.day, today)} at {formatTime(last.checkedInAt)}
            </>
          ) : (
            "Has not checked in yet."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-eyebrow text-[0.6rem] text-muted-foreground">This month</dt>
            <dd className="font-heading text-2xl font-extrabold tabular-nums">{summary.thisMonth}</dd>
          </div>
          <div>
            <dt className="text-eyebrow text-[0.6rem] text-muted-foreground">All time</dt>
            <dd className="font-heading text-2xl font-extrabold tabular-nums">{summary.total}</dd>
          </div>
        </dl>
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Last 4 weeks</p>
          <ol className="grid grid-cols-14 gap-1" aria-label="Visits in the last 28 days">
            {summary.recentDays.map((d) => (
              <li
                key={d.day}
                title={`${formatDay(d.day)}: ${d.visits} visit${d.visits === 1 ? "" : "s"}`}
                className={cn(
                  "aspect-square rounded-sm",
                  d.visits === 0 ? "bg-muted" : d.visits === 1 ? "bg-brand-400" : "bg-brand-600",
                  d.day === today && "ring-2 ring-brand-500/40 ring-offset-1",
                )}
              />
            ))}
          </ol>
        </div>
        <Link href={{ pathname: "/attendance", query: last ? { day: last.day } : {} }} className="text-xs font-medium text-brand-600 hover:underline">
          Open attendance
        </Link>
      </CardContent>
    </Card>
  );
}
