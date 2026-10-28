import Link from "next/link";
import { Trash2Icon } from "lucide-react";
import { ConfirmAction } from "@/components/members/confirm-action";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteAttendance } from "@/lib/attendance/actions";
import type { AttendanceRow } from "@/lib/attendance/queries";
import { formatTime, relativeDay } from "@/lib/attendance/time";
import { fullName } from "@/lib/members/format";
import { MemberAvatar } from "./member-avatar";
import { PeriodBadge } from "./period-badge";

/** Everyone who came in on the selected day, in order of arrival. */
export function DayLog({ rows, day, today }: { rows: AttendanceRow[]; day: string; today: string }) {
  const label = relativeDay(day, today).toLowerCase();
  return (
    <Card className="ring-stone/80">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Who came in {label === "today" || label === "yesterday" ? label : `on ${label}`}</CardTitle>
        <CardDescription>
          {rows.length === 0 ? "No check-ins recorded." : `${rows.length} check-in${rows.length === 1 ? "" : "s"}, in order of arrival`}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {rows.length === 0 ? (
          <p className="mx-4 rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            Nothing yet. Members check themselves in from Attendance Mode, or use “Record a visit”.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-24 pl-4">Time</TableHead>
                <TableHead>Member</TableHead>
                <TableHead className="hidden sm:table-cell">Period</TableHead>
                <TableHead className="hidden md:table-cell">Recorded</TableHead>
                <TableHead className="hidden lg:table-cell">Note</TableHead>
                <TableHead className="w-10 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="pl-4 font-medium tabular-nums">{formatTime(row.checkedInAt)}</TableCell>
                  <TableCell>
                    <Link href={`/members/${row.member.id}`} className="flex items-center gap-2.5 hover:underline">
                      <MemberAvatar member={row.member} className="size-8 text-xs" />
                      <span>
                        <span className="block font-semibold">{fullName(row.member)}</span>
                        <span className="block text-xs text-muted-foreground">#{row.member.serialNo}</span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <PeriodBadge period={row.period} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {row.source === "kiosk" ? (
                      <span className="text-xs">Self check-in</span>
                    ) : (
                      <Badge variant="outline" className="rounded-full">
                        Staff{row.recordedByUser ? ` · ${row.recordedByUser.name}` : ""}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden max-w-64 truncate text-muted-foreground lg:table-cell">{row.note ?? ""}</TableCell>
                  <TableCell className="pr-4">
                    <ConfirmAction
                      action={deleteAttendance.bind(null, row.id)}
                      title="Remove this check-in?"
                      description={`${fullName(row.member)} at ${formatTime(row.checkedInAt)} will be removed from the attendance record.`}
                      confirmLabel="Remove"
                      destructive
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                    >
                      <Trash2Icon />
                      <span className="sr-only">Remove</span>
                    </ConfirmAction>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
