import Link from "next/link";
import { ChevronRightIcon, UserRoundPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDay } from "@/lib/members/dates";
import { daysLeft, formatNumber, fullName } from "@/lib/members/format";
import type { MemberListRow } from "@/lib/members/queries";
import { PackageBadge } from "./package-badge";

export function MemberTable({
  members,
  emptyMessage,
  canCreate,
}: {
  members: MemberListRow[];
  emptyMessage: string;
  /** Shows the "Add a member" link in the empty state. */
  canCreate?: boolean;
}) {
  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-foreground">
            <UserRoundPlusIcon className="size-6" />
          </span>
          <p className="font-semibold">{emptyMessage}</p>
          {canCreate ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/members/new">Add a member</Link>
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
            <TableHead>Member</TableHead>
            <TableHead className="hidden md:table-cell">Package</TableHead>
            <TableHead className="hidden lg:table-cell">Last follow-up</TableHead>
            <TableHead className="hidden text-right xl:table-cell">Weight</TableHead>
            <TableHead className="hidden sm:table-cell">Joined</TableHead>
            <TableHead className="w-10 pr-4" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((c) => {
            const pkg = c.currentPackage;
            const left = pkg ? daysLeft(pkg) : null;
            return (
              <TableRow key={c.id} className="group">
                <TableCell className="pl-4 font-mono text-xs text-muted-foreground">#{c.serialNo}</TableCell>
                <TableCell>
                  <Link href={`/members/${c.id}`} className="font-semibold hover:underline">
                    {fullName(c)}
                  </Link>
                  <div className="text-xs text-muted-foreground">{c.mobile ?? c.email ?? "No contact"}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <PackageBadge state={c.packageState} />
                    {pkg ? (
                      <span className="text-xs text-muted-foreground">
                        {pkg.name}
                        {c.packageState === "active" || c.packageState === "expiring"
                          ? ` · ${left} days left`
                          : c.packageState === "expired"
                            ? ` · ended ${formatDay(pkg.endDate)}`
                            : ""}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {c.latestCheckin ? formatDay(c.latestCheckin.recordedOn) : "Never"}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums xl:table-cell">
                  {c.latestCheckin?.weightKg != null ? `${formatNumber(c.latestCheckin.weightKg)} kg` : "—"}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDay(c.joinedOn)}</TableCell>
                <TableCell className="pr-4">
                  <Link href={`/members/${c.id}`} aria-label={`Open ${fullName(c)}`} className="block text-muted-foreground transition group-hover:text-foreground">
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
