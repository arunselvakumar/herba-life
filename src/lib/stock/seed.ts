import { inArray } from "drizzle-orm";
import type { Database } from "@/db";
import { product } from "@/db/schema";
import { PRICE_LIST, PRICE_LIST_CATEGORIES } from "./price-list";

/**
 * Puts every product on the Herbalife price list into the catalog. Products
 * already there (by stock number) are left untouched, so prices edited in
 * the console survive a re-seed. Returns how many were added.
 */
export async function ensureProducts(db: Database, createdBy: string | null = null): Promise<number> {
  const existing = await db
    .select({ stockNo: product.stockNo })
    .from(product)
    .where(
      inArray(
        product.stockNo,
        PRICE_LIST.map((p) => p.stockNo),
      ),
    );
  const have = new Set(existing.map((r) => r.stockNo));
  const missing = PRICE_LIST.filter((p) => !have.has(p.stockNo));
  if (missing.length === 0) return 0;

  await db.insert(product).values(
    missing.map((p, i) => ({
      stockNo: p.stockNo,
      name: p.name,
      category: p.category,
      volumePoints: p.volumePoints,
      mrp: p.mrp,
      bronzePrice: p.bronze,
      silverPrice: p.silver,
      goldPrice: p.gold,
      // Keep the price list's print order within and across categories.
      sortOrder: PRICE_LIST_CATEGORIES.indexOf(p.category) * 100 + i,
      createdBy,
    })),
  );
  return missing.length;
}
