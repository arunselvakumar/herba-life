import Link from "next/link";
import { ChevronRightIcon, PackageSearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/members/format";
import type { StockRow } from "@/lib/stock/queries";
import { cn } from "@/lib/utils";
import { StockBadge } from "./stock-badge";

export function StockTable({
  products,
  emptyMessage,
  canManage,
}: {
  products: StockRow[];
  emptyMessage: string;
  /** Shows the "Add a product" link in the empty state (stock.products). */
  canManage?: boolean;
}) {
  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-foreground">
            <PackageSearchIcon className="size-6" />
          </span>
          <p className="font-semibold">{emptyMessage}</p>
          {canManage ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/stock/products/new">Add a product</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const groups = new Map<string, StockRow[]>();
  for (const p of products) {
    const list = groups.get(p.category) ?? [];
    list.push(p);
    groups.set(p.category, list);
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-20 pl-4">Stock no</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">On hand</TableHead>
            <TableHead className="hidden text-right sm:table-cell">MRP</TableHead>
            <TableHead className="hidden text-right lg:table-cell">Bronze</TableHead>
            <TableHead className="hidden text-right lg:table-cell">Silver</TableHead>
            <TableHead className="hidden text-right lg:table-cell">Gold</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="w-10 pr-4" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...groups].map(([category, list]) => (
            <CategoryRows key={category} category={category} products={list} />
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function CategoryRows({ category, products }: { category: string; products: StockRow[] }) {
  return (
    <>
      <TableRow className="bg-muted/50 hover:bg-muted/50">
        <TableCell colSpan={9} className="py-2 pl-4 text-[0.7rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          {category}
        </TableCell>
      </TableRow>
      {products.map((p) => (
        <TableRow key={p.id} className={cn("group", p.state === "archived" && "text-muted-foreground")}>
          <TableCell className="pl-4 font-mono text-xs text-muted-foreground">{p.stockNo}</TableCell>
          <TableCell>
            <Link href={`/stock/${p.id}`} className="font-semibold hover:underline">
              {p.name}
            </Link>
            {p.volumePoints !== null ? <div className="text-xs text-muted-foreground">{p.volumePoints} VP</div> : null}
          </TableCell>
          <TableCell className={cn("text-right text-base font-semibold tabular-nums", p.state === "out" && "text-destructive", p.state === "low" && "text-amber-800")}>
            {p.onHand}
          </TableCell>
          <TableCell className="hidden text-right tabular-nums sm:table-cell">{formatMoney(p.mrp)}</TableCell>
          <TableCell className="hidden text-right text-muted-foreground tabular-nums lg:table-cell">{formatMoney(p.bronzePrice)}</TableCell>
          <TableCell className="hidden text-right text-muted-foreground tabular-nums lg:table-cell">{formatMoney(p.silverPrice)}</TableCell>
          <TableCell className="hidden text-right text-muted-foreground tabular-nums lg:table-cell">{formatMoney(p.goldPrice)}</TableCell>
          <TableCell className="hidden md:table-cell">
            <StockBadge state={p.state} />
          </TableCell>
          <TableCell className="pr-4">
            <Link href={`/stock/${p.id}`} aria-label={`Open ${p.name}`} className="flex justify-end text-muted-foreground transition-colors group-hover:text-foreground">
              <ChevronRightIcon className="size-4" />
            </Link>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
