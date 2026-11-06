import { z } from "zod";
import { UUID_RE } from "@/lib/members/form-defaults";
import { blankToNull, day, enumValues, optionalInt, optionalNumber, optionalText, optionalUuid } from "@/lib/members/validation";
import { PAYMENT_MODES, PRICE_LEVELS } from "./format";

const MAX_MONEY = 10_000_000;
const MAX_QUANTITY = 100_000;

const uuid = (message: string) => z.string({ error: message }).regex(UUID_RE, message);

export const productSchema = z.object({
  stockNo: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Enter the Herbalife stock number")
    .max(12, "Stock numbers are short codes")
    .regex(/^[A-Z0-9-]+$/, "Letters, digits and dashes only"),
  name: z.string().trim().min(1, "Give the product a name").max(120),
  category: z.string().trim().min(1, "Pick or type a category").max(60),
  volumePoints: optionalNumber(0, 10_000),
  mrp: z.coerce.number({ error: "Enter the MRP" }).min(0, "MRP cannot be negative").max(MAX_MONEY),
  bronzePrice: optionalNumber(0, MAX_MONEY),
  silverPrice: optionalNumber(0, MAX_MONEY),
  goldPrice: optionalNumber(0, MAX_MONEY),
  reorderLevel: optionalInt(0, MAX_QUANTITY),
  sortOrder: optionalInt(0, 100_000),
});
export type ProductInput = z.infer<typeof productSchema>;

export const receiveSchema = z.object({
  productId: z.preprocess(blankToNull, uuid("Choose a product")),
  quantity: z.coerce.number({ error: "How many came in?" }).int("Whole units only").min(1, "At least one").max(MAX_QUANTITY),
  movedOn: day,
  unitCost: optionalNumber(0, MAX_MONEY),
  note: optionalText(300),
});
export type ReceiveInput = z.infer<typeof receiveSchema>;

export const adjustSchema = z.object({
  productId: z.preprocess(blankToNull, uuid("Choose a product")),
  direction: z.enum(["add", "remove"], { error: "Add or remove?" }),
  quantity: z.coerce.number({ error: "How many?" }).int("Whole units only").min(1, "At least one").max(MAX_QUANTITY),
  movedOn: day,
  reason: z.string().trim().min(1, "Say why the count changed").max(300),
});
export type AdjustInput = z.infer<typeof adjustSchema>;

const saleLine = z.object({
  productId: uuid("Choose a product"),
  quantity: z.coerce.number({ error: "Enter a quantity" }).int("Whole units only").min(1, "At least one").max(MAX_QUANTITY),
  unitPrice: z.coerce.number({ error: "Enter a price" }).min(0, "Price cannot be negative").max(MAX_MONEY),
});
export type SaleLineInput = z.infer<typeof saleLine>;

const asList = (value: unknown): unknown[] => (value === undefined ? [] : Array.isArray(value) ? value : [value]);

/**
 * The sale form posts its lines as three parallel lists (`productId[]`,
 * `quantity[]`, `unitPrice[]`), zipped here into line objects. Blank product
 * rows (an empty line the person never filled) are dropped before validation.
 */
export const saleSchema = z
  .object({
    memberId: optionalUuid,
    buyerName: optionalText(120),
    soldOn: day,
    priceLevel: z.enum(enumValues(PRICE_LEVELS)).default("mrp"),
    paymentMode: z.enum(enumValues(PAYMENT_MODES)).default("cash"),
    amountPaid: optionalNumber(0, MAX_MONEY),
    notes: optionalText(500),
    productId: z.preprocess(asList, z.array(z.string())).default([]),
    quantity: z.preprocess(asList, z.array(z.string())).default([]),
    unitPrice: z.preprocess(asList, z.array(z.string())).default([]),
  })
  .transform(({ productId, quantity, unitPrice, ...rest }, ctx) => {
    const rows = productId
      .map((id, i) => ({ productId: id, quantity: quantity[i] ?? "", unitPrice: unitPrice[i] ?? "" }))
      .filter((r) => r.productId.trim() !== "" || r.quantity.trim() !== "");
    const items: SaleLineInput[] = [];
    rows.forEach((row, i) => {
      const parsed = saleLine.safeParse(row);
      if (parsed.success) {
        items.push(parsed.data);
        return;
      }
      for (const issue of parsed.error.issues) {
        ctx.addIssue({ code: "custom", path: [`items.${i}.${String(issue.path[0])}`], message: issue.message });
      }
    });
    if (rows.length === 0) ctx.addIssue({ code: "custom", path: ["items"], message: "Add at least one product." });
    if (!rest.memberId && !rest.buyerName) {
      ctx.addIssue({ code: "custom", path: ["buyerName"], message: "Pick a member or type the buyer's name." });
    }
    return { ...rest, items };
  });
export type SaleInput = z.infer<typeof saleSchema>;

export const voidSaleSchema = z.object({
  reason: z.string().trim().min(1, "Say why the sale is being voided").max(300),
});
