"use server";

import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { member, product, sale, saleItem, stockMovement } from "@/db/schema";
import { permissionFor, requirePermission } from "@/lib/access/guards";
import type { FormState } from "@/lib/members/form-state";
import { UUID_RE } from "@/lib/members/form-defaults";
import { fullName } from "@/lib/members/format";
import { flattenErrors, formDataToObject, type FieldErrors } from "@/lib/members/validation";
import { roundMoney } from "./format";
import { adjustSchema, productSchema, receiveSchema, saleSchema, voidSaleSchema } from "./validation";
import { stockNoTaken } from "./queries";

function assertId(id: string): string {
  if (!UUID_RE.test(id)) throw new Error("Invalid id");
  return id;
}

function invalid(errors: FieldErrors, message = "Please fix the highlighted fields."): FormState {
  return { status: "error", message, errors };
}

function revalidateStock(productId?: string) {
  revalidatePath("/stock");
  revalidatePath("/stock/sales");
  revalidatePath("/stock/sales/new");
  revalidatePath("/dashboard");
  if (productId) revalidatePath(`/stock/${productId}`);
}

// ---------------------------------------------------------------------------
// Products

export async function createProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const guard = await permissionFor("stock.products");
  if (!guard.ok) return guard.state;
  const parsed = productSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(flattenErrors(parsed.error));

  const { reorderLevel, sortOrder, ...rest } = parsed.data;
  if (await stockNoTaken(rest.stockNo)) return invalid({ stockNo: ["A product with this stock number already exists."] });

  const [created] = await db
    .insert(product)
    .values({ ...rest, reorderLevel: reorderLevel ?? 2, sortOrder: sortOrder ?? 0, createdBy: guard.user.id })
    .returning({ id: product.id });
  revalidateStock();
  redirect(created ? `/stock/${created.id}` : "/stock");
}

export async function updateProduct(productId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const guard = await permissionFor("stock.products");
  if (!guard.ok) return guard.state;
  const id = assertId(productId);
  const parsed = productSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(flattenErrors(parsed.error));

  const { reorderLevel, sortOrder, ...rest } = parsed.data;
  if (await stockNoTaken(rest.stockNo, id)) return invalid({ stockNo: ["Another product already has this stock number."] });

  const [updated] = await db
    .update(product)
    .set({ ...rest, reorderLevel: reorderLevel ?? 2, sortOrder: sortOrder ?? 0 })
    .where(eq(product.id, id))
    .returning({ id: product.id });
  if (!updated) return invalid({}, "This product no longer exists.");
  revalidateStock(id);
  redirect(`/stock/${id}`);
}

export async function setProductActive(productId: string, isActive: boolean): Promise<void> {
  await requirePermission("stock.products");
  const id = assertId(productId);
  await db.update(product).set({ isActive }).where(eq(product.id, id));
  revalidateStock(id);
}

/** Only products that were never received, sold or adjusted can be deleted; archive the rest. */
export async function deleteProduct(productId: string): Promise<void> {
  await requirePermission("stock.delete");
  const id = assertId(productId);
  const [movements, items] = await Promise.all([
    db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(stockMovement).where(eq(stockMovement.productId, id)),
    db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(saleItem).where(eq(saleItem.productId, id)),
  ]);
  if ((movements[0]?.n ?? 0) > 0 || (items[0]?.n ?? 0) > 0) {
    throw new Error("This product has stock history. Archive it instead.");
  }
  await db.delete(product).where(eq(product.id, id));
  revalidateStock();
  redirect("/stock");
}

// ---------------------------------------------------------------------------
// Ledger

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Lock the product rows so two sales cannot both take the last unit, then read what is on hand. */
async function lockOnHand(tx: Tx, productIds: string[]): Promise<Map<string, { name: string; stockNo: string; isActive: boolean; onHand: number }>> {
  if (productIds.length === 0) return new Map();
  const locked = await tx
    .select({ id: product.id, name: product.name, stockNo: product.stockNo, isActive: product.isActive })
    .from(product)
    .where(inArray(product.id, productIds))
    .for("update");
  const sums = await tx
    .select({ productId: stockMovement.productId, onHand: sql<number>`coalesce(sum(${stockMovement.quantity}), 0)`.mapWith(Number) })
    .from(stockMovement)
    .where(inArray(stockMovement.productId, productIds))
    .groupBy(stockMovement.productId);
  const onHand = new Map(sums.map((s) => [s.productId, s.onHand]));
  return new Map(locked.map((p) => [p.id, { ...p, onHand: onHand.get(p.id) ?? 0 }]));
}

export async function receiveStock(_prev: FormState, formData: FormData): Promise<FormState> {
  const guard = await permissionFor("stock.receive");
  if (!guard.ok) return guard.state;
  const parsed = receiveSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(flattenErrors(parsed.error));
  const { productId, quantity, movedOn, unitCost, note } = parsed.data;

  const target = await db.query.product.findFirst({ where: eq(product.id, productId), columns: { id: true, name: true, isActive: true } });
  if (!target) return invalid({ productId: ["That product no longer exists."] });
  if (!target.isActive) return invalid({ productId: ["This product is archived. Restore it before receiving stock."] });

  await db.insert(stockMovement).values({ productId, kind: "received", quantity, movedOn, unitCost, note, recordedBy: guard.user.id });
  revalidateStock(productId);
  return { status: "success", message: `Added ${quantity} × ${target.name} to stock.` };
}

export async function adjustStock(_prev: FormState, formData: FormData): Promise<FormState> {
  const guard = await permissionFor("stock.adjust");
  if (!guard.ok) return guard.state;
  const parsed = adjustSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(flattenErrors(parsed.error));
  const { productId, direction, quantity, movedOn, reason } = parsed.data;
  const delta = direction === "remove" ? -quantity : quantity;

  const result = await db.transaction(async (tx) => {
    const stock = await lockOnHand(tx, [productId]);
    const target = stock.get(productId);
    if (!target) return invalid({ productId: ["That product no longer exists."] });
    if (!target.isActive) return invalid({ productId: ["This product is archived."] });
    if (target.onHand + delta < 0) {
      return invalid({ quantity: [`Only ${target.onHand} on hand; you cannot remove ${quantity}.`] });
    }
    await tx.insert(stockMovement).values({ productId, kind: "adjustment", quantity: delta, movedOn, note: reason, recordedBy: guard.user.id });
    return { status: "success", message: `${target.name} is now at ${target.onHand + delta}.` } satisfies FormState;
  });
  if (result.status === "success") revalidateStock(productId);
  return result;
}

// ---------------------------------------------------------------------------
// Sales

export async function createSale(_prev: FormState, formData: FormData): Promise<FormState> {
  const guard = await permissionFor("stock.sell");
  if (!guard.ok) return guard.state;
  const parsed = saleSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(flattenErrors(parsed.error), "Please check the sale.");
  const { memberId, buyerName, soldOn, priceLevel, paymentMode, amountPaid, notes, items } = parsed.data;

  // Several lines for the same product are merged, so the stock check sees the whole quantity.
  const byProduct = new Map<string, { quantity: number; unitPrice: number }>();
  for (const line of items) {
    const existing = byProduct.get(line.productId);
    if (existing && existing.unitPrice !== line.unitPrice) {
      return invalid({ items: ["The same product appears twice at different prices. Combine the lines."] }, "Please check the sale.");
    }
    byProduct.set(line.productId, { quantity: (existing?.quantity ?? 0) + line.quantity, unitPrice: line.unitPrice });
  }

  let buyer = buyerName;
  if (memberId) {
    const found = await db.query.member.findFirst({ where: eq(member.id, memberId), columns: { firstName: true, lastName: true } });
    if (!found) return invalid({ memberId: ["That member no longer exists."] });
    buyer = fullName(found);
  }
  if (!buyer) return invalid({ buyerName: ["Pick a member or type the buyer's name."] });

  const total = roundMoney([...byProduct.values()].reduce((sum, l) => sum + l.quantity * l.unitPrice, 0));
  const paid = amountPaid === null ? total : roundMoney(amountPaid);
  if (paid > total) return invalid({ amountPaid: [`That is more than the total (${total}).`] });

  const outcome = await db.transaction(async (tx): Promise<{ id: string } | FormState> => {
    const stock = await lockOnHand(tx, [...byProduct.keys()]);
    const errors: FieldErrors = {};
    for (const [productId, line] of byProduct) {
      const p = stock.get(productId);
      if (!p) errors.items = ["One of the products no longer exists."];
      else if (!p.isActive) errors.items = [`${p.name} is archived and cannot be sold.`];
      else if (p.onHand < line.quantity) (errors.items ??= []).push(`Only ${p.onHand} × ${p.name} on hand.`);
    }
    if (errors.items) return invalid(errors, "Not enough stock for this sale.");

    const [created] = await tx
      .insert(sale)
      .values({ memberId, buyerName: buyer, soldOn, priceLevel, total, amountPaid: paid, paymentMode, notes, soldBy: guard.user.id })
      .returning({ id: sale.id, serialNo: sale.serialNo });
    if (!created) throw new Error("Could not save the sale");

    await tx.insert(saleItem).values(
      [...byProduct].map(([productId, line]) => {
        const p = stock.get(productId)!;
        return { saleId: created.id, productId, stockNo: p.stockNo, name: p.name, quantity: line.quantity, unitPrice: line.unitPrice, lineTotal: roundMoney(line.quantity * line.unitPrice) };
      }),
    );
    await tx.insert(stockMovement).values(
      [...byProduct].map(([productId, line]) => ({
        productId,
        kind: "sold" as const,
        quantity: -line.quantity,
        saleId: created.id,
        movedOn: soldOn,
        note: `Sale #${created.serialNo} · ${buyer}`,
        recordedBy: guard.user.id,
      })),
    );
    return { id: created.id };
  });

  if ("status" in outcome) return outcome;
  revalidateStock();
  for (const productId of byProduct.keys()) revalidatePath(`/stock/${productId}`);
  if (memberId) revalidatePath(`/members/${memberId}`);
  redirect(`/stock/sales/${outcome.id}`);
}

/** Reverses the sale's stock movements and marks it voided. The sale stays on record. */
export async function voidSale(saleId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const guard = await permissionFor("stock.adjust");
  if (!guard.ok) return guard.state;
  const id = assertId(saleId);
  const parsed = voidSaleSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(flattenErrors(parsed.error));

  const result = await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(sale).where(eq(sale.id, id)).for("update");
    if (!existing) return invalid({}, "This sale no longer exists.");
    if (existing.voidedAt) return invalid({}, "This sale was already voided.");

    const sold = await tx
      .select()
      .from(stockMovement)
      .where(and(eq(stockMovement.saleId, id), eq(stockMovement.kind, "sold")));
    const now = new Date();
    const movedOn = now.toISOString().slice(0, 10);
    if (sold.length > 0) {
      await tx.insert(stockMovement).values(
        sold.map((m) => ({
          productId: m.productId,
          kind: "sold" as const,
          quantity: -m.quantity,
          saleId: id,
          movedOn,
          note: `Sale #${existing.serialNo} voided · ${parsed.data.reason}`,
          recordedBy: guard.user.id,
        })),
      );
    }
    await tx
      .update(sale)
      .set({ voidedAt: now, voidReason: parsed.data.reason, voidedBy: guard.user.id })
      .where(and(eq(sale.id, id), isNull(sale.voidedAt)));
    return { memberId: existing.memberId, productIds: sold.map((m) => m.productId) };
  });
  if ("status" in result) return result;

  revalidateStock();
  revalidatePath(`/stock/sales/${id}`);
  for (const productId of result.productIds) revalidatePath(`/stock/${productId}`);
  if (result.memberId) revalidatePath(`/members/${result.memberId}`);
  return { status: "success", message: "Sale voided and stock returned to the shelf." };
}
