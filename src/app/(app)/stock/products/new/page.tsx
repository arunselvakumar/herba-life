import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { NoAccess } from "@/components/app/no-access";
import { PageHeader } from "@/components/members/field";
import { ProductForm } from "@/components/stock/product-form";
import { can } from "@/lib/access/can";
import { createProduct } from "@/lib/stock/actions";
import { listCategories } from "@/lib/stock/queries";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "New product",
};

export default function NewProductPage() {
  return (
    <Suspense fallback={<Skeleton className="h-72 w-full rounded-3xl" />}>
      <NewProduct />
    </Suspense>
  );
}

async function NewProduct() {
  const user = await getCurrentUser();
  if (!can(user, "stock.products")) return <NoAccess permission="stock.products" />;
  await connection();
  const categories = await listCategories();
  return (
    <>
      <PageHeader eyebrow="Stock" title="New product" description="Add a product that is not on the seeded price list, or a new variant." />
      <div className="max-w-5xl">
        <ProductForm action={createProduct} defaults={{ reorderLevel: "2" }} categories={categories} submitLabel="Create product" cancelHref="/stock" />
      </div>
    </>
  );
}
