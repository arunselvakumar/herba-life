import Link from "next/link";
import { ChevronRightIcon, MessageSquarePlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { goalLabels, sourceLabel } from "@/lib/inquiries/format";
import type { InquiryListRow } from "@/lib/inquiries/queries";
import { formatDay } from "@/lib/members/dates";
import { fullName } from "@/lib/members/format";
import { FollowUpDue, InquiryStatusBadge } from "./inquiry-badges";

export function InquiryTable({
  inquiries,
  today,
  emptyMessage,
  canCreate,
}: {
  inquiries: InquiryListRow[];
  today: string;
  emptyMessage: string;
  /** Shows the "Record an enquiry" link in the empty state. */
  canCreate?: boolean;
}) {
  if (inquiries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-foreground">
            <MessageSquarePlusIcon className="size-6" />
          </span>
          <p className="font-semibold">{emptyMessage}</p>
          {canCreate ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/inquiries/new">Record an enquiry</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-16 pl-4">No.</TableHead>
            <TableHead>Person</TableHead>
            <TableHead className="hidden md:table-cell">Source</TableHead>
            <TableHead className="hidden xl:table-cell">Looking for</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Next follow-up</TableHead>
            <TableHead className="hidden sm:table-cell">Enquired</TableHead>
            <TableHead className="w-10 pr-4" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {inquiries.map((row) => {
            const goals = goalLabels(row.goals);
            const closed = row.status === "converted" || row.status === "lost";
            return (
              <TableRow key={row.id} className="group">
                <TableCell className="pl-4 font-mono text-xs text-muted-foreground">#{row.serialNo}</TableCell>
                <TableCell>
                  <Link href={`/inquiries/${row.id}`} className="font-semibold hover:underline">
                    {fullName(row)}
                  </Link>
                  <div className="text-xs text-muted-foreground">{row.mobile ?? row.email ?? "No contact"}</div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {sourceLabel(row.source)}
                  {row.referredBy ? <div className="text-xs">by {row.referredBy}</div> : null}
                </TableCell>
                <TableCell className="hidden max-w-56 xl:table-cell">
                  <div className="truncate text-muted-foreground">{goals.length > 0 ? goals.join(", ") : "—"}</div>
                  {row.interestedPlan ? <div className="text-xs text-muted-foreground">Package: {row.interestedPlan.name}</div> : null}
                </TableCell>
                <TableCell>
                  <InquiryStatusBadge status={row.status} />
                  {row.assignedUser ? <div className="mt-1 text-xs text-muted-foreground">{row.assignedUser.name}</div> : null}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {closed ? <span className="text-sm text-muted-foreground">—</span> : <FollowUpDue nextFollowUpOn={row.nextFollowUpOn} today={today} />}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDay(row.inquiredOn)}</TableCell>
                <TableCell className="pr-4">
                  <Link href={`/inquiries/${row.id}`} aria-label={`Open ${fullName(row)}`} className="block text-muted-foreground transition group-hover:text-foreground">
                    <ChevronRightIcon className="size-4" />
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
