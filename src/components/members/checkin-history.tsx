import { Trash2Icon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteCheckin } from "@/lib/members/actions";
import { MEASUREMENTS } from "@/lib/members/constants";
import { formatDay } from "@/lib/members/dates";
import { rangeVerdict } from "@/lib/members/format";
import type { MemberDetail } from "@/lib/members/queries";
import { ConfirmAction } from "./confirm-action";
import { Delta, MeasurementValue } from "./measurement-value";

/**
 * The digital version of the paper "Follow Up Record" grid: one row per visit,
 * newest first, with the change in weight against the previous visit.
 */
export function CheckinHistory({ member }: { member: MemberDetail }) {
  const rows = member.checkins; // newest first

  return (
    <Card className="ring-stone/80">
      <CardHeader>
        <CardTitle className="text-base font-bold">Follow-up record</CardTitle>
        <CardDescription>
          {rows.length === 0 ? "No visits recorded yet." : `${rows.length} visit${rows.length === 1 ? "" : "s"} recorded`}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {rows.length === 0 ? (
          <p className="mx-4 rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Use the form above to record the first visit.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Date</TableHead>
                {MEASUREMENTS.map((m) => (
                  <TableHead key={m.key} className="text-right" title={m.label}>
                    {m.short}
                  </TableHead>
                ))}
                <TableHead className="min-w-40">Remarks</TableHead>
                <TableHead className="w-10 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => {
                const previous = rows[index + 1] ?? null;
                return (
                  <TableRow key={row.id}>
                    <TableCell className="pl-4 align-top">
                      <div className="font-medium">{formatDay(row.recordedOn)}</div>
                      <div className="text-[0.7rem] text-muted-foreground">{row.recordedByUser?.name ?? "—"}</div>
                    </TableCell>
                    {MEASUREMENTS.map((m) => (
                      <TableCell key={m.key} className="text-right align-top">
                        <MeasurementValue
                          value={row[m.key]}
                          verdict={rangeVerdict(m.key, row[m.key], member.gender)}
                          digits={m.step === "1" ? 0 : 1}
                        />
                        {m.key === "weightKg" || m.key === "bodyFatPct" || m.key === "waistCm" ? (
                          <Delta current={row[m.key]} previous={previous?.[m.key] ?? null} />
                        ) : m.key === "muscleMassPct" ? (
                          <Delta current={row[m.key]} previous={previous?.[m.key] ?? null} invert />
                        ) : null}
                      </TableCell>
                    ))}
                    <TableCell className="max-w-64 align-top whitespace-normal text-muted-foreground">
                      {row.remarks ?? ""}
                    </TableCell>
                    <TableCell className="pr-4 align-top">
                      <ConfirmAction
                        action={deleteCheckin.bind(null, member.id, row.id)}
                        title="Delete this follow-up?"
                        description={`The visit on ${formatDay(row.recordedOn)} will be removed permanently.`}
                        confirmLabel="Delete"
                        destructive
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground"
                      >
                        <Trash2Icon />
                        <span className="sr-only">Delete</span>
                      </ConfirmAction>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
