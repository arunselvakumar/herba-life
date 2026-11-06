import Link from "next/link";
import { ShoppingBagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDay } from "@/lib/members/dates";
import { formatMoney } from "@/lib/members/format";
import { listMemberSales } from "@/lib/stock/queries";
import { cn } from "@/lib/utils";
import { itemsSummary } from "./sale-table";
import { BalanceBadge, VoidedBadge } from "./stock-badge";

/** The member's recent product purchases, for the profile's side column. */
export async function MemberPurchases({ memberId, canSell }: { memberId: string; canSell: boolean }) {
  const sales = await listMemberSales(memberId);
  const owed = sales.filter((s) => s.voidedAt === null).reduce((sum, s) => sum + Math.max(s.total - s.amountPaid, 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-bold">Purchases</CardTitle>
        <CardDescription>{owed > 0 ? <span className="font-medium text-amber-800">Balance due {formatMoney(owed)}</span> : "Products bought from the counter"}</CardDescription>
        {canSell ? (
          <CardAction>
            <Button asChild size="sm">
              <Link href={{ pathname: "/stock/sales/new", query: { member: memberId } }}>
                <ShoppingBagIcon data-icon="inline-start" />
                Sell products
              </Link>
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2">
        {sales.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            {canSell ? "Nothing bought yet. Record a sale when they pick something up." : "Nothing bought yet."}
          </p>
        ) : (
          sales.map((s) => {
            const voided = s.voidedAt !== null;
            return (
              <Link
                key={s.id}
                href={`/stock/sales/${s.id}`}
                className={cn("flex items-start justify-between gap-3 rounded-2xl border bg-muted/60 p-3 transition-colors hover:bg-muted", voided && "text-muted-foreground")}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("text-sm font-semibold", voided && "line-through")}>{itemsSummary(s.items)}</span>
                    {voided ? <VoidedBadge /> : <BalanceBadge balance={s.total - s.amountPaid} />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sale #{s.serialNo} · {formatDay(s.soldOn)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(s.total)}</span>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
