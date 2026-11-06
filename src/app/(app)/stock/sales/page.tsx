import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { BoxesIcon, SearchIcon, ShoppingBagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportButton } from "@/components/app/export-button";
import { NoAccess } from "@/components/app/no-access";
import { PageHeader, PageHeaderSkeleton } from "@/components/members/field";
import { SaleTable } from "@/components/stock/sale-table";
import { can } from "@/lib/access/can";
import { today } from "@/lib/members/dates";
import { formatMoney } from "@/lib/members/format";
import { listSales, type SaleFilter } from "@/lib/stock/queries";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sales",
};

const FILTERS: readonly { value: SaleFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "month", label: "This month" },
  { value: "balance", label: "Balance due" },
  { value: "voided", label: "Voided" },
];

function isFilter(value: unknown): value is SaleFilter {
  return FILTERS.some((f) => f.value === value);
}

export default function SalesPage(props: PageProps<"/stock/sales">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeaderSkeleton descriptionLines={1} />
          <ListSkeleton />
        </>
      }
    >
      <Sales searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Sales({ searchParams }: { searchParams: PageProps<"/stock/sales">["searchParams"] }) {
  const user = await getCurrentUser();
  if (!can(user, "stock.view")) return <NoAccess permission="stock.view" />;
  const canSell = can(user, "stock.sell");
  const canExport = can(user, "stock.export");

  return (
    <>
      <PageHeader
        eyebrow="Stock"
        title="Sales"
        description="Every product sale from the counter, newest first. Open one to see the receipt or void it."
        actions={
          <>
            {canExport ? <ExportButton module="stock" /> : null}
            <Button asChild variant="outline" size="lg">
              <Link href="/stock">
                <BoxesIcon data-icon="inline-start" />
                Stock on hand
              </Link>
            </Button>
            {canSell ? (
              <Button asChild size="lg">
                <Link href="/stock/sales/new">
                  <ShoppingBagIcon data-icon="inline-start" />
                  New sale
                </Link>
              </Button>
            ) : null}
          </>
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <SaleList searchParams={searchParams} canSell={canSell} />
      </Suspense>
    </>
  );
}

async function SaleList({ searchParams, canSell }: { searchParams: PageProps<"/stock/sales">["searchParams"]; canSell: boolean }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const filter: SaleFilter = isFilter(params.filter) ? params.filter : "all";
  await connection();
  const sales = await listSales({ q, filter, today: today() });
  const standing = sales.filter((s) => s.voidedAt === null);
  const revenue = standing.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Filter sales" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const href = { pathname: "/stock/sales", query: { ...(q ? { q } : {}), ...(f.value === "all" ? {} : { filter: f.value }) } };
            const active = f.value === filter;
            return (
              <Link
                key={f.value}
                href={href}
                className={cn(
                  "inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold ring-1 transition-[background-color,color,box-shadow] duration-200",
                  active ? "bg-primary text-primary-foreground ring-primary" : "bg-card text-muted-foreground ring-border hover:text-foreground hover:ring-foreground/30",
                )}
                aria-current={active ? "page" : undefined}
              >
                {f.label}
              </Link>
            );
          })}
        </nav>
        <form action="/stock/sales" method="get" role="search" className="relative md:w-80">
          {filter !== "all" ? <input type="hidden" name="filter" value={filter} /> : null}
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" name="q" defaultValue={q ?? ""} placeholder="Buyer or sale no." className="h-11 pl-11" aria-label="Search sales" />
        </form>
      </div>

      <p className="text-xs text-muted-foreground">
        {sales.length} sale{sales.length === 1 ? "" : "s"}
        {standing.length > 0 ? ` · ${formatMoney(revenue)}` : ""}
        {q ? ` matching “${q}”` : ""}
      </p>

      <SaleTable
        sales={sales}
        canSell={canSell}
        emptyMessage={q ? "No sales match that search." : filter === "all" ? "No sales yet." : filter === "balance" ? "Nobody owes a balance." : filter === "voided" ? "No voided sales." : "No sales this month yet."}
      />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-xl" />
      <Skeleton className="h-72 w-full rounded-3xl" />
    </div>
  );
}
