import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { PackagePlusIcon, ReceiptTextIcon, SearchIcon, ShoppingBagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportButton } from "@/components/app/export-button";
import { NoAccess } from "@/components/app/no-access";
import { PageHeader, PageHeaderSkeleton } from "@/components/members/field";
import { ReceiveStockDialog } from "@/components/stock/receive-stock-dialog";
import { StockTable } from "@/components/stock/stock-table";
import { can } from "@/lib/access/can";
import { today } from "@/lib/members/dates";
import { listProductOptions, listStock, type StockFilter } from "@/lib/stock/queries";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Stock",
};

const FILTERS: readonly { value: StockFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "low", label: "Running low" },
  { value: "out", label: "Out of stock" },
  { value: "archived", label: "Archived" },
];

function isFilter(value: unknown): value is StockFilter {
  return FILTERS.some((f) => f.value === value);
}

export default function StockPage(props: PageProps<"/stock">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeaderSkeleton descriptionLines={1} />
          <ListSkeleton />
        </>
      }
    >
      <Stock searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Stock({ searchParams }: { searchParams: PageProps<"/stock">["searchParams"] }) {
  const user = await getCurrentUser();
  if (!can(user, "stock.view")) return <NoAccess permission="stock.view" />;
  const canReceive = can(user, "stock.receive");
  const canSell = can(user, "stock.sell");
  const canManage = can(user, "stock.products");
  const canExport = can(user, "stock.export");

  return (
    <>
      <PageHeader
        eyebrow="Stock"
        title="Stock on hand"
        description="Every product on the shelf with what is left of it. Receive deliveries here and sell from the counter."
        actions={
          <>
            {canExport ? <ExportButton module="stock" /> : null}
            <Button asChild variant="outline" size="lg">
              <Link href="/stock/sales">
                <ReceiptTextIcon data-icon="inline-start" />
                Sales
              </Link>
            </Button>
            {canManage ? (
              <Button asChild variant="outline" size="lg">
                <Link href="/stock/products/new">
                  <PackagePlusIcon data-icon="inline-start" />
                  New product
                </Link>
              </Button>
            ) : null}
            {canReceive ? (
              <Suspense fallback={<Skeleton className="h-11 w-40 rounded-full" />}>
                <Receive />
              </Suspense>
            ) : null}
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
        <StockList searchParams={searchParams} canManage={canManage} />
      </Suspense>
    </>
  );
}

async function Receive() {
  await connection();
  const products = await listProductOptions();
  return <ReceiveStockDialog products={products} today={today()} variant="outline" />;
}

async function StockList({ searchParams, canManage }: { searchParams: PageProps<"/stock">["searchParams"]; canManage: boolean }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const filter: StockFilter = isFilter(params.filter) ? params.filter : "all";
  await connection();
  const products = await listStock({ q, filter });
  const units = products.reduce((sum, p) => sum + Math.max(p.onHand, 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Filter stock" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const href = { pathname: "/stock", query: { ...(q ? { q } : {}), ...(f.value === "all" ? {} : { filter: f.value }) } };
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
        <form action="/stock" method="get" role="search" className="relative md:w-80">
          {filter !== "all" ? <input type="hidden" name="filter" value={filter} /> : null}
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" name="q" defaultValue={q ?? ""} placeholder="Name, stock number or category" className="h-11 pl-11" aria-label="Search stock" />
        </form>
      </div>

      <p className="text-xs text-muted-foreground">
        {products.length} product{products.length === 1 ? "" : "s"}
        {filter === "archived" ? "" : ` · ${units} unit${units === 1 ? "" : "s"} on the shelf`}
        {q ? ` matching “${q}”` : ""}
      </p>

      <StockTable
        products={products}
        canManage={canManage}
        emptyMessage={
          q
            ? "No products match that search."
            : filter === "low"
              ? "Nothing is running low."
              : filter === "out"
                ? "Nothing is out of stock."
                : filter === "archived"
                  ? "No archived products."
                  : "No products yet."
        }
      />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-xl" />
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  );
}
