import Link from "next/link";
import { ChevronRightIcon, ReceiptTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDay } from "@/lib/members/dates";
import { formatMoney } from "@/lib/members/format";
import { paymentModeLabel } from "@/lib/stock/format";
import type { SaleListRow } from "@/lib/stock/queries";
import { cn } from "@/lib/utils";
import { BalanceBadge, VoidedBadge } from "./stock-badge";

export function itemsSummary(items: Pick<SaleListRow["items"][number], "name" | "quantity">[]): string {
  const units = items.reduce((sum, i) => sum + i.quantity, 0);
  if (items.length === 1 && items[0]) return `${items[0].quantity} × ${items[0].name}`;
  return `${units} unit${units === 1 ? "" : "s"} · ${items.length} product${items.length === 1 ? "" : "s"}`;
}

export function SaleTable({ sales, emptyMessage, canSell }: { sales: SaleListRow[]; emptyMessage: string; canSell?: boolean }) {
  if (sales.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-foreground">
            <ReceiptTextIcon className="size-6" />
          </span>
          <p className="font-semibold">{emptyMessage}</p>
          {canSell ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/stock/sales/new">Record a sale</Link>
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
            <TableHead>Buyer</TableHead>
            <TableHead className="hidden md:table-cell">Items</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Paid</TableHead>
            <TableHead className="hidden lg:table-cell">Sold on</TableHead>
            <TableHead className="hidden xl:table-cell">By</TableHead>
            <TableHead className="w-10 pr-4" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((s) => {
            const balance = s.total - s.amountPaid;
            const voided = s.voidedAt !== null;
            return (
              <TableRow key={s.id} className={cn("group", voided && "text-muted-foreground")}>
                <TableCell className="pl-4 font-mono text-xs text-muted-foreground">#{s.serialNo}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/stock/sales/${s.id}`} className={cn("font-semibold hover:underline", voided && "line-through")}>
                      {s.buyerName}
                    </Link>
                    {voided ? <VoidedBadge /> : <BalanceBadge balance={balance} />}
                  </div>
                  <div className="text-xs text-muted-foreground md:hidden">{itemsSummary(s.items)}</div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{itemsSummary(s.items)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatMoney(s.total)}</TableCell>
                <TableCell className="hidden text-right text-muted-foreground tabular-nums sm:table-cell">
                  {formatMoney(s.amountPaid)}
                  <div className="text-xs">{paymentModeLabel(s.paymentMode)}</div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDay(s.soldOn)}</TableCell>
                <TableCell className="hidden text-muted-foreground xl:table-cell">{s.soldByUser?.name ?? "—"}</TableCell>
                <TableCell className="pr-4">
                  <Link href={`/stock/sales/${s.id}`} aria-label={`Open sale #${s.serialNo}`} className="flex justify-end text-muted-foreground transition-colors group-hover:text-foreground">
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
