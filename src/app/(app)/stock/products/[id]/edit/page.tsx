import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { NoAccess } from "@/components/app/no-access";
import { PageHeader } from "@/components/members/field";
import { ProductForm } from "@/components/stock/product-form";
import { can } from "@/lib/access/can";
import { UUID_RE } from "@/lib/members/form-defaults";
import { updateProduct } from "@/lib/stock/actions";
import { getProduct, listCategories } from "@/lib/stock/queries";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Edit product",
};

export default function EditProductPage(props: PageProps<"/stock/products/[id]/edit">) {
  return (
    <Suspense fallback={<Skeleton className="h-72 w-full rounded-3xl" />}>
      <EditProduct params={props.params} />
    </Suspense>
  );
}

const text = (value: number | null) => (value === null ? "" : String(value));

async function EditProduct({ params }: { params: PageProps<"/stock/products/[id]/edit">["params"] }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const user = await getCurrentUser();
  await connection();
  const [product, categories] = await Promise.all([getProduct(id), listCategories()]);
  if (!can(user, "stock.products")) return <NoAccess permission="stock.products" />;
  if (!product) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Stock"
        title={`Edit ${product.name}`}
        ghost={product.stockNo}
        description="Price changes apply to new sales only; receipts already written keep the price they were sold at."
      />
      <div className="max-w-5xl">
        <ProductForm
          action={updateProduct.bind(null, product.id)}
          defaults={{
            stockNo: product.stockNo,
            name: product.name,
            category: product.category,
            volumePoints: text(product.volumePoints),
            mrp: text(product.mrp),
            bronzePrice: text(product.bronzePrice),
            silverPrice: text(product.silverPrice),
            goldPrice: text(product.goldPrice),
            reorderLevel: String(product.reorderLevel),
            sortOrder: String(product.sortOrder),
          }}
          categories={categories}
          submitLabel="Save changes"
          cancelHref={`/stock/${product.id}`}
        />
      </div>
    </>
  );
}
