import type { PaymentMode, PriceLevel, Product, StockMovementKind } from "@/db/schema";

/**
 * Labels and small pure helpers for the stock module. Safe to import from
 * client components: no server-only code lives here.
 */

export const PRICE_LEVELS = [
  { value: "mrp", label: "MRP", hint: "printed price" },
  { value: "bronze", label: "Bronze", hint: "introductory level" },
  { value: "silver", label: "Silver", hint: "100 VP in 12 months" },
  { value: "gold", label: "Gold", hint: "500 VP in 12 months" },
] as const satisfies readonly { value: PriceLevel; label: string; hint: string }[];

export const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
] as const satisfies readonly { value: PaymentMode; label: string }[];

export const MOVEMENT_KINDS = [
  { value: "received", label: "Received" },
  { value: "sold", label: "Sold" },
  { value: "adjustment", label: "Adjustment" },
] as const satisfies readonly { value: StockMovementKind; label: string }[];

export function priceLevelLabel(level: PriceLevel): string {
  return PRICE_LEVELS.find((l) => l.value === level)?.label ?? level;
}

export function paymentModeLabel(mode: PaymentMode): string {
  return PAYMENT_MODES.find((m) => m.value === mode)?.label ?? mode;
}

export type Priced = Pick<Product, "mrp" | "bronzePrice" | "silverPrice" | "goldPrice">;

/** The unit price for a price level, falling back to MRP when the product has no price at that level. */
export function priceFor(product: Priced, level: PriceLevel): number {
  switch (level) {
    case "bronze":
      return product.bronzePrice ?? product.mrp;
    case "silver":
      return product.silverPrice ?? product.mrp;
    case "gold":
      return product.goldPrice ?? product.mrp;
    default:
      return product.mrp;
  }
}

export type StockState = "in_stock" | "low" | "out" | "archived";

export function stockState(p: { onHand: number; reorderLevel: number; isActive: boolean }): StockState {
  if (!p.isActive) return "archived";
  if (p.onHand <= 0) return "out";
  if (p.onHand <= p.reorderLevel) return "low";
  return "in_stock";
}

export const STOCK_STATE_LABELS: Record<StockState, string> = {
  in_stock: "In stock",
  low: "Running low",
  out: "Out of stock",
  archived: "Archived",
};

/** `#12` style label for a sale. */
export function saleLabel(sale: { serialNo: number }): string {
  return `Sale #${sale.serialNo}`;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
