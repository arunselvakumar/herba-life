import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArchiveIcon, ArchiveRestoreIcon, PencilIcon, ShoppingBagIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NoAccess } from "@/components/app/no-access";
import { ConfirmAction } from "@/components/members/confirm-action";
import { PageHeader, PageHeaderSkeleton } from "@/components/members/field";
import { AdjustStockDialog } from "@/components/stock/adjust-stock-dialog";
import { MovementHistory } from "@/components/stock/movement-history";
import { ReceiveStockDialog } from "@/components/stock/receive-stock-dialog";
import { StockBadge } from "@/components/stock/stock-badge";
import { can } from "@/lib/access/can";
import { today } from "@/lib/members/dates";
import { UUID_RE } from "@/lib/members/form-defaults";
import { formatMoney } from "@/lib/members/format";
import { deleteProduct, setProductActive } from "@/lib/stock/actions";
import { getProduct, listProductOptions } from "@/lib/stock/queries";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Product",
};

export default function ProductPage(props: PageProps<"/stock/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeaderSkeleton descriptionLines={1} />
          <Skeleton className="h-28 w-full rounded-3xl" />
          <Skeleton className="h-72 w-full rounded-3xl" />
        </>
      }
    >
      <Product params={props.params} />
    </Suspense>
  );
}

async function Product({ params }: { params: PageProps<"/stock/[id]">["params"] }) {
  const user = await getCurrentUser();
  if (!can(user, "stock.view")) return <NoAccess permission="stock.view" />;
  const canReceive = can(user, "stock.receive");
  const canAdjust = can(user, "stock.adjust");
  const canManage = can(user, "stock.products");
  const canDelete = can(user, "stock.delete");
  const canSell = can(user, "stock.sell");

  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  await connection();
  const now = today();
  const [product, options] = await Promise.all([getProduct(id), canReceive ? listProductOptions() : Promise.resolve([])]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        eyebrow={`Stock · ${product.category}`}
        title={product.name}
        ghost={product.stockNo}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono">Stock no {product.stockNo}</span>
            {product.volumePoints !== null ? <span>{product.volumePoints} volume points</span> : null}
            <StockBadge state={product.state} />
          </span>
        }
        actions={
          <>
            {canManage ? (
              <Button asChild variant="outline" size="lg">
                <Link href={`/stock/products/${product.id}/edit`}>
                  <PencilIcon data-icon="inline-start" />
                  Edit
                </Link>
              </Button>
            ) : null}
            {canManage ? (
              product.isActive ? (
                <ConfirmAction
                  action={setProductActive.bind(null, product.id, false)}
                  title={`Archive ${product.name}?`}
                  description="Old sales keep it. It just cannot be received or sold until restored."
                  confirmLabel="Archive"
                  variant="outline"
                  size="lg"
                >
                  <ArchiveIcon data-icon="inline-start" />
                  Archive
                </ConfirmAction>
              ) : (
                <ConfirmAction action={setProductActive.bind(null, product.id, true)} title={`Restore ${product.name}?`} confirmLabel="Restore" variant="outline" size="lg">
                  <ArchiveRestoreIcon data-icon="inline-start" />
                  Restore
                </ConfirmAction>
              )
            ) : null}
            {canDelete && !product.hasHistory ? (
              <ConfirmAction
                action={deleteProduct.bind(null, product.id)}
                title={`Delete ${product.name}?`}
                description="It was never stocked or sold, so it can be removed permanently."
                confirmLabel="Delete"
                destructive
                variant="outline"
                size="lg"
                className="text-destructive"
              >
                <Trash2Icon data-icon="inline-start" />
                Delete
              </ConfirmAction>
            ) : null}
            {canAdjust && product.isActive ? <AdjustStockDialog productId={product.id} productName={product.name} onHand={product.onHand} today={now} /> : null}
            {canReceive && product.isActive ? <ReceiveStockDialog products={options} productId={product.id} today={now} /> : null}
            {canSell && product.isActive && product.onHand > 0 ? (
              <Button asChild variant="outline" size="lg">
                <Link href={{ pathname: "/stock/sales/new", query: { product: product.id } }}>
                  <ShoppingBagIcon data-icon="inline-start" />
                  Sell
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <section aria-label="Product summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription className="text-eyebrow">On hand</CardDescription>
            <CardTitle className="font-heading text-3xl font-semibold tracking-tight tabular-nums">{product.onHand}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Running low at {product.reorderLevel} or fewer · {product.unitsSold} sold so far
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="text-eyebrow">MRP</CardDescription>
            <CardTitle className="font-heading text-3xl font-semibold tracking-tight tabular-nums">{formatMoney(product.mrp)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Inclusive of GST · the default sale price</CardContent>
        </Card>
        <Card className="sm:col-span-2">
          <CardHeader>
            <CardDescription className="text-eyebrow">Preferred customer prices</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-3 gap-3 text-sm">
              <PriceCell label="Bronze" hint="introductory" value={product.bronzePrice} />
              <PriceCell label="Silver" hint="100 VP" value={product.silverPrice} />
              <PriceCell label="Gold" hint="500 VP" value={product.goldPrice} />
            </dl>
          </CardContent>
        </Card>
      </section>

      <MovementHistory movements={product.movements} onHand={product.onHand} />
    </>
  );
}

function PriceCell({ label, hint, value }: { label: string; hint: string; value: number | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">
        {label} <span className="text-[0.65rem]">· {hint}</span>
      </dt>
      <dd className="font-heading text-xl font-semibold tracking-tight tabular-nums">{formatMoney(value)}</dd>
    </div>
  );
}
