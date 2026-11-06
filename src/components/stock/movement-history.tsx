import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDay } from "@/lib/members/dates";
import { formatMoney } from "@/lib/members/format";
import type { MovementRow } from "@/lib/stock/queries";
import { cn } from "@/lib/utils";

/** Every change to a product's count, newest first, with a running balance. */
export function MovementHistory({ movements, onHand }: { movements: MovementRow[]; onHand: number }) {
  // Newest first, so the balance after each row counts down from today's figure.
  const rows: { m: MovementRow; after: number }[] = [];
  let running = onHand;
  for (const m of movements) {
    rows.push({ m, after: running });
    running -= m.quantity;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-bold">History</CardTitle>
        <CardDescription>Every delivery, sale and correction, newest first</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {rows.length === 0 ? (
          <p className="mx-6 rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Nothing yet. Receive a delivery to put this product on the shelf.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Date</TableHead>
                <TableHead>What</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">After</TableHead>
                <TableHead className="hidden text-right md:table-cell">Unit cost</TableHead>
                <TableHead className="hidden pr-6 lg:table-cell">By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ m, after }) => (
                <TableRow key={m.id}>
                  <TableCell className="pl-6 whitespace-nowrap text-muted-foreground">{formatDay(m.movedOn)}</TableCell>
                  <TableCell>
                    <MovementLabel m={m} />
                    {m.kind !== "sold" && m.note ? <div className="text-xs text-muted-foreground">{m.note}</div> : null}
                  </TableCell>
                  <TableCell className={cn("text-right font-semibold tabular-nums", m.quantity > 0 ? "text-brand-700" : "text-destructive")}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">{after}</TableCell>
                  <TableCell className="hidden text-right text-muted-foreground tabular-nums md:table-cell">{m.unitCost !== null ? formatMoney(m.unitCost) : "—"}</TableCell>
                  <TableCell className="hidden pr-6 text-muted-foreground lg:table-cell">{m.recordedByUser?.name ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function MovementLabel({ m }: { m: MovementRow }) {
  if (m.kind === "received") return <span className="font-medium">Received</span>;
  if (m.kind === "adjustment") return <span className="font-medium">Adjustment</span>;
  const reversal = m.quantity > 0;
  return (
    <span className="font-medium">
      {reversal ? "Returned to shelf" : "Sold"}
      {m.sale ? (
        <>
          {" · "}
          <Link href={`/stock/sales/${m.sale.id}`} className="hover:underline">
            Sale #{m.sale.serialNo}
          </Link>
          <span className="font-normal text-muted-foreground"> · {m.sale.buyerName}</span>
          {reversal ? <span className="font-normal text-muted-foreground"> · voided</span> : null}
        </>
      ) : null}
    </span>
  );
}
