import "server-only";

import { and, asc, desc, eq, gte, ilike, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { member, product, sale, saleItem, stockMovement, user } from "@/db/schema";
import type { Member, Product, Sale, SaleItem, StockMovement } from "@/db/schema";
import { addDays } from "@/lib/members/dates";
import { PRICE_LIST_CATEGORIES } from "./price-list";
import { stockState, type StockState } from "./format";

const onHandOf = sql<number>`coalesce(sum(${stockMovement.quantity}), 0)`.mapWith(Number);

// ---------------------------------------------------------------------------
// Products and what is on the shelf.

export type StockRow = Product & { onHand: number; state: StockState };

export type StockFilter = "all" | "low" | "out" | "archived";

/** Every product with its on-hand count. Archived products only show under the "archived" filter. */
export async function listStock({ q, filter = "all" }: { q?: string | undefined; filter?: StockFilter | undefined }): Promise<StockRow[]> {
  const term = q?.trim();
  const rows = await db
    .select({ product, onHand: onHandOf })
    .from(product)
    .leftJoin(stockMovement, eq(stockMovement.productId, product.id))
    .where(
      and(
        filter === "archived" ? eq(product.isActive, false) : eq(product.isActive, true),
        term ? or(ilike(product.name, `%${term}%`), ilike(product.stockNo, `%${term}%`), ilike(product.category, `%${term}%`)) : undefined,
      ),
    )
    .groupBy(product.id)
    .orderBy(asc(product.sortOrder), asc(product.category), asc(product.name));
  const list = rows.map((r) => withState(r.product, r.onHand));
  switch (filter) {
    case "low":
      return list.filter((p) => p.state === "low" || p.state === "out");
    case "out":
      return list.filter((p) => p.state === "out");
    default:
      return list;
  }
}

function withState(p: Product, onHand: number): StockRow {
  return { ...p, onHand, state: stockState({ onHand, reorderLevel: p.reorderLevel, isActive: p.isActive }) };
}

/** Categories in use plus the price list's own, in print order then alphabetical. */
export async function listCategories(): Promise<string[]> {
  const rows = await db.selectDistinct({ category: product.category }).from(product).orderBy(asc(product.category));
  const known = new Set(PRICE_LIST_CATEGORIES);
  const extra = rows.map((r) => r.category).filter((c) => !known.has(c));
  return [...PRICE_LIST_CATEGORIES, ...extra];
}

export type MovementRow = StockMovement & {
  recordedByUser: { name: string } | null;
  sale: Pick<Sale, "id" | "serialNo" | "buyerName" | "voidedAt"> | null;
};

export type ProductDetail = StockRow & {
  movements: MovementRow[];
  /** Units sold on sales that still stand. */
  unitsSold: number;
  /** Whether anything was ever received, sold or adjusted (decides delete vs archive). */
  hasHistory: boolean;
};

export async function getProduct(id: string): Promise<ProductDetail | null> {
  const row = await db.query.product.findFirst({
    where: eq(product.id, id),
    with: {
      movements: {
        with: {
          recordedByUser: { columns: { name: true } },
          sale: { columns: { id: true, serialNo: true, buyerName: true, voidedAt: true } },
        },
        orderBy: [desc(stockMovement.movedOn), desc(stockMovement.createdAt)],
      },
    },
  });
  if (!row) return null;
  const { movements, ...rest } = row;
  const onHand = movements.reduce((sum, m) => sum + m.quantity, 0);
  const unitsSold = movements.filter((m) => m.kind === "sold").reduce((sum, m) => sum - m.quantity, 0);
  const [{ items } = { items: 0 }] = await db
    .select({ items: sql<number>`count(*)`.mapWith(Number) })
    .from(saleItem)
    .where(eq(saleItem.productId, id));
  return { ...withState(rest, onHand), movements, unitsSold, hasHistory: movements.length > 0 || items > 0 };
}

export type ProductOption = Pick<Product, "id" | "stockNo" | "name" | "category" | "mrp" | "bronzePrice" | "silverPrice" | "goldPrice"> & {
  onHand: number;
};

/** Products that can be received or sold, with what is on the shelf, in price-list order. */
export async function listProductOptions(): Promise<ProductOption[]> {
  const rows = await db
    .select({
      id: product.id,
      stockNo: product.stockNo,
      name: product.name,
      category: product.category,
      mrp: product.mrp,
      bronzePrice: product.bronzePrice,
      silverPrice: product.silverPrice,
      goldPrice: product.goldPrice,
      onHand: onHandOf,
    })
    .from(product)
    .leftJoin(stockMovement, eq(stockMovement.productId, product.id))
    .where(eq(product.isActive, true))
    .groupBy(product.id)
    .orderBy(asc(product.sortOrder), asc(product.category), asc(product.name));
  return rows;
}

export async function stockNoTaken(stockNo: string, exceptId?: string): Promise<boolean> {
  const row = await db.query.product.findFirst({
    where: and(sql`lower(${product.stockNo}) = lower(${stockNo})`, exceptId ? sql`${product.id} <> ${exceptId}` : undefined),
    columns: { id: true },
  });
  return Boolean(row);
}

// ---------------------------------------------------------------------------
// Sales.

export type MemberRef = Pick<Member, "id" | "serialNo" | "firstName" | "lastName">;
const memberRefColumns = { id: true, serialNo: true, firstName: true, lastName: true } as const;

export type SaleListRow = Sale & {
  items: Pick<SaleItem, "id" | "name" | "quantity">[];
  member: MemberRef | null;
  soldByUser: { name: string } | null;
};

export type SaleFilter = "all" | "month" | "balance" | "voided";

export async function listSales({ q, filter = "all", today }: { q?: string | undefined; filter?: SaleFilter | undefined; today: string }): Promise<SaleListRow[]> {
  const term = q?.trim();
  const monthStart = `${today.slice(0, 7)}-01`;
  return db.query.sale.findMany({
    where: and(
      term
        ? or(
            ilike(sale.buyerName, `%${term}%`),
            /^\d+$/.test(term) ? eq(sale.serialNo, Number(term)) : undefined,
          )
        : undefined,
      filter === "month" ? and(gte(sale.soldOn, monthStart), isNull(sale.voidedAt)) : undefined,
      filter === "balance" ? and(sql`${sale.amountPaid} < ${sale.total}`, isNull(sale.voidedAt)) : undefined,
      filter === "voided" ? isNotNull(sale.voidedAt) : undefined,
    ),
    with: {
      items: { columns: { id: true, name: true, quantity: true } },
      member: { columns: memberRefColumns },
      soldByUser: { columns: { name: true } },
    },
    orderBy: [desc(sale.soldOn), desc(sale.createdAt)],
    limit: 500,
  });
}

export type SaleDetail = Sale & {
  items: SaleItem[];
  member: MemberRef | null;
  soldByUser: { name: string } | null;
  voidedByUser: { name: string } | null;
};

export async function getSale(id: string): Promise<SaleDetail | null> {
  const row = await db.query.sale.findFirst({
    where: eq(sale.id, id),
    with: {
      items: true,
      member: { columns: memberRefColumns },
      soldByUser: { columns: { name: true } },
      voidedByUser: { columns: { name: true } },
    },
  });
  return row ?? null;
}

/** A member's purchases, newest first, for the profile card. */
export async function listMemberSales(memberId: string, limit = 8): Promise<SaleListRow[]> {
  return db.query.sale.findMany({
    where: eq(sale.memberId, memberId),
    with: {
      items: { columns: { id: true, name: true, quantity: true } },
      member: { columns: memberRefColumns },
      soldByUser: { columns: { name: true } },
    },
    orderBy: [desc(sale.soldOn), desc(sale.createdAt)],
    limit,
  });
}

export type MemberPickerOption = MemberRef & { mobile: string | null };

/** Every member, for the buyer picker. A branch has tens to hundreds, not thousands. */
export async function listBuyerOptions(): Promise<MemberPickerOption[]> {
  return db.query.member.findMany({
    columns: { ...memberRefColumns, mobile: true },
    orderBy: [asc(member.firstName), asc(member.lastName)],
  });
}

// ---------------------------------------------------------------------------
// Dashboard.

export type StockDashboard = {
  products: number;
  low: number;
  out: number;
  /** Units on the shelf × MRP, for a sense of what is tied up in stock. */
  stockValue: number;
  salesThisMonth: number;
  revenueThisMonth: number;
  salesLast30: number;
  lowList: Pick<StockRow, "id" | "stockNo" | "name" | "onHand" | "reorderLevel" | "state">[];
};

export async function getStockDashboard(today: string): Promise<StockDashboard> {
  const monthStart = `${today.slice(0, 7)}-01`;
  const since = addDays(today, -29);
  const [stock, [month], [last30]] = await Promise.all([
    listStock({ filter: "all" }),
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number), revenue: sql<number>`coalesce(sum(${sale.total}), 0)`.mapWith(Number) })
      .from(sale)
      .where(and(gte(sale.soldOn, monthStart), lte(sale.soldOn, today), isNull(sale.voidedAt))),
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(sale)
      .where(and(gte(sale.soldOn, since), lte(sale.soldOn, today), isNull(sale.voidedAt))),
  ]);
  const lowList = stock
    .filter((p) => p.state === "low" || p.state === "out")
    .sort((a, b) => a.onHand - b.onHand || a.name.localeCompare(b.name))
    .map((p) => ({ id: p.id, stockNo: p.stockNo, name: p.name, onHand: p.onHand, reorderLevel: p.reorderLevel, state: p.state }));
  return {
    products: stock.length,
    low: stock.filter((p) => p.state === "low").length,
    out: stock.filter((p) => p.state === "out").length,
    stockValue: stock.reduce((sum, p) => sum + Math.max(p.onHand, 0) * p.mrp, 0),
    salesThisMonth: month?.count ?? 0,
    revenueThisMonth: month?.revenue ?? 0,
    salesLast30: last30?.count ?? 0,
    lowList,
  };
}

// Re-exported so pages can resolve staff names without importing the schema.
export { user };
