import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { BanIcon, ReceiptTextIcon, ShoppingBagIcon, UserRoundIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NoAccess } from "@/components/app/no-access";
import { PageHeader, PageHeaderSkeleton } from "@/components/members/field";
import { BalanceBadge, VoidedBadge } from "@/components/stock/stock-badge";
import { VoidSaleDialog } from "@/components/stock/void-sale-dialog";
import { can } from "@/lib/access/can";
import { formatDay } from "@/lib/members/dates";
import { UUID_RE } from "@/lib/members/form-defaults";
import { formatMoney, fullName } from "@/lib/members/format";
import { paymentModeLabel, priceLevelLabel } from "@/lib/stock/format";
import { getSale } from "@/lib/stock/queries";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sale",
};

const dateTime = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

export default function SalePage(props: PageProps<"/stock/sales/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeaderSkeleton descriptionLines={1} />
          <Skeleton className="h-72 w-full rounded-3xl" />
        </>
      }
    >
      <Sale params={props.params} />
    </Suspense>
  );
}

async function Sale({ params }: { params: PageProps<"/stock/sales/[id]">["params"] }) {
  const user = await getCurrentUser();
  if (!can(user, "stock.view")) return <NoAccess permission="stock.view" />;
  const canVoid = can(user, "stock.adjust");
  const canSell = can(user, "stock.sell");
  const canSeeMembers = can(user, "members.view");

  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  await connection();
  const sale = await getSale(id);
  if (!sale) notFound();

  const voided = sale.voidedAt !== null;
  const balance = Math.max(sale.total - sale.amountPaid, 0);
  const units = sale.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      <PageHeader
        eyebrow="Stock · Sales"
        title={`Sale #${sale.serialNo}`}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{formatDay(sale.soldOn)}</span>
            <span>
              {units} unit{units === 1 ? "" : "s"} · {priceLevelLabel(sale.priceLevel)} prices
            </span>
            {sale.soldByUser ? <span>Sold by {sale.soldByUser.name}</span> : null}
            {voided ? <VoidedBadge /> : <BalanceBadge balance={balance} />}
          </span>
        }
        actions={
          <>
            <Button asChild variant="outline" size="lg">
              <Link href="/stock/sales">
                <ReceiptTextIcon data-icon="inline-start" />
                All sales
              </Link>
            </Button>
            {canVoid && !voided ? <VoidSaleDialog saleId={sale.id} serialNo={sale.serialNo} /> : null}
            {canSell ? (
              <Button asChild size="lg">
                <Link href={sale.memberId ? { pathname: "/stock/sales/new", query: { member: sale.memberId } } : "/stock/sales/new"}>
                  <ShoppingBagIcon data-icon="inline-start" />
                  New sale
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      {voided ? (
        <Alert variant="destructive">
          <BanIcon />
          <AlertTitle>Voided {sale.voidedAt ? dateTime.format(sale.voidedAt) : ""}{sale.voidedByUser ? ` by ${sale.voidedByUser.name}` : ""}</AlertTitle>
          <AlertDescription>{sale.voidReason}. Every unit went back on the shelf.</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <Card className={cn(voided && "opacity-70")}>
          <CardHeader>
            <CardTitle className="text-base font-bold">Items</CardTitle>
            <CardDescription>Prices as charged at the time; later catalog changes do not touch this receipt.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-20 pl-6">Stock no</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="pr-6 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-6 font-mono text-xs text-muted-foreground">{item.stockNo}</TableCell>
                    <TableCell>
                      {item.productId ? (
                        <Link href={`/stock/${item.productId}`} className="font-medium hover:underline">
                          {item.name}
                        </Link>
                      ) : (
                        <span className="font-medium">{item.name}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">{formatMoney(item.unitPrice)}</TableCell>
                    <TableCell className="pr-6 text-right font-semibold tabular-nums">{formatMoney(item.lineTotal)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableCell colSpan={4} className="pl-6 text-right font-semibold">
                    Total
                  </TableCell>
                  <TableCell className="pr-6 text-right font-heading text-lg font-semibold tabular-nums">{formatMoney(sale.total)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <UserRoundIcon className="size-4" />
                Buyer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {sale.member && canSeeMembers ? (
                <Link href={`/members/${sale.member.id}`} className="font-semibold hover:underline">
                  {fullName(sale.member)}
                </Link>
              ) : (
                <p className="font-semibold">{sale.buyerName}</p>
              )}
              <p className="text-xs text-muted-foreground">{sale.member ? `Member #${sale.member.serialNo}` : sale.memberId ? "Member (record removed)" : "Walk-in"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <Row label="Total" value={formatMoney(sale.total)} />
                <Row label="Paid" value={`${formatMoney(sale.amountPaid)} · ${paymentModeLabel(sale.paymentMode)}`} />
                <Row label="Balance" value={balance > 0 ? formatMoney(balance) : "Nil"} className={balance > 0 ? "font-semibold text-amber-800" : undefined} />
                <Row label="Recorded" value={dateTime.format(sale.createdAt)} />
              </dl>
            </CardContent>
          </Card>

          {sale.notes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold">Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap text-muted-foreground">{sale.notes}</CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string | undefined }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("tabular-nums", className)}>{value}</dd>
    </div>
  );
}
