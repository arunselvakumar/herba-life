import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { NoAccess } from "@/components/app/no-access";
import { PageHeader, PageHeaderSkeleton } from "@/components/members/field";
import { SaleForm } from "@/components/stock/sale-form";
import { can } from "@/lib/access/can";
import { today } from "@/lib/members/dates";
import { UUID_RE } from "@/lib/members/form-defaults";
import { createSale } from "@/lib/stock/actions";
import { listBuyerOptions, listProductOptions } from "@/lib/stock/queries";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "New sale",
};

export default function NewSalePage(props: PageProps<"/stock/sales/new">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeaderSkeleton descriptionLines={1} />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </>
      }
    >
      <NewSale searchParams={props.searchParams} />
    </Suspense>
  );
}

async function NewSale({ searchParams }: { searchParams: PageProps<"/stock/sales/new">["searchParams"] }) {
  const user = await getCurrentUser();
  if (!can(user, "stock.sell")) return <NoAccess permission="stock.sell" />;
  const params = await searchParams;
  const memberId = typeof params.member === "string" && UUID_RE.test(params.member) ? params.member : undefined;
  const productId = typeof params.product === "string" && UUID_RE.test(params.product) ? params.product : undefined;
  await connection();
  const [products, members] = await Promise.all([listProductOptions(), listBuyerOptions()]);

  return (
    <>
      <PageHeader eyebrow="Stock" title="New sale" description="Who is buying, what they are taking, and what they paid. Stock comes off the shelf when you save." />
      <SaleForm action={createSale} products={products} members={members} today={today()} memberId={memberId} productId={productId} />
    </>
  );
}
