import { relations } from "drizzle-orm";
import { boolean, date, index, integer, numeric, pgEnum, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { member } from "./members-schema";
import { money } from "./record-columns";

/**
 * Stock schema: the Herbalife products the branch keeps on the shelf, a
 * ledger of every change to what is on hand, and the sales that take stock
 * out. See docs/stock-module.md.
 *
 * On-hand is never stored on the product. It is the sum of a product's
 * movements, so there is always a history behind the number and a sale can
 * be undone by reversing its movements.
 */

export const stockMovementKindEnum = pgEnum("stock_movement_kind", ["received", "sold", "adjustment"]);
export const paymentModeEnum = pgEnum("payment_mode", ["cash", "upi", "card", "other"]);
/** Which column of the Herbalife price list a sale was priced from. */
export const priceLevelEnum = pgEnum("price_level", ["mrp", "bronze", "silver", "gold"]);

/** One row per product on the Herbalife price list. Prices are edited in place when a new list arrives. */
export const product = pgTable(
  "product",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Herbalife's stock number, e.g. `1247` or `082K`. Stored upper-case. */
    stockNo: text("stock_no").notNull().unique(),
    name: text("name").notNull(),
    /** A section of the price list, e.g. "Weight management". Free text. */
    category: text("category").notNull(),
    volumePoints: numeric("volume_points", { precision: 7, scale: 2, mode: "number" }),
    /** Maximum retail price, inclusive of GST. */
    mrp: money("mrp").notNull(),
    bronzePrice: money("bronze_price"),
    silverPrice: money("silver_price"),
    goldPrice: money("gold_price"),
    /** At or below this on-hand count the product shows as running low. */
    reorderLevel: integer("reorder_level").notNull().default(2),
    /** Archived products stay on old sales but cannot be received or sold. */
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("product_category_idx").on(table.category, table.sortOrder, table.name)],
);

/** One visit to the counter: a buyer, one or more lines, a payment. Never edited; voided instead. */
export const sale = pgTable(
  "sale",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serialNo: serial("serial_no").notNull().unique(),
    memberId: uuid("member_id").references(() => member.id, { onDelete: "set null" }),
    /** The member's name at the time of sale, or the walk-in's name. */
    buyerName: text("buyer_name").notNull(),
    soldOn: date("sold_on").notNull(),
    priceLevel: priceLevelEnum("price_level").notNull().default("mrp"),
    total: money("total").notNull(),
    amountPaid: money("amount_paid").notNull().default(0),
    paymentMode: paymentModeEnum("payment_mode").notNull().default("cash"),
    notes: text("notes"),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    voidReason: text("void_reason"),
    voidedBy: text("voided_by").references(() => user.id, { onDelete: "set null" }),
    soldBy: text("sold_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("sale_sold_on_idx").on(table.soldOn, table.createdAt), index("sale_member_idx").on(table.memberId, table.soldOn)],
);

/** A line on a sale. Stock number, name and price are copied so catalog edits never rewrite a receipt. */
export const saleItem = pgTable(
  "sale_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    saleId: uuid("sale_id")
      .notNull()
      .references(() => sale.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => product.id, { onDelete: "set null" }),
    stockNo: text("stock_no").notNull(),
    name: text("name").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: money("unit_price").notNull(),
    lineTotal: money("line_total").notNull(),
  },
  (table) => [index("sale_item_sale_idx").on(table.saleId), index("sale_item_product_idx").on(table.productId)],
);

/**
 * The ledger. `quantity` is signed: positive puts stock on the shelf,
 * negative takes it off. "sold" rows are written by a sale (and reversed when
 * it is voided); "received" and "adjustment" rows are entered by staff.
 */
export const stockMovement = pgTable(
  "stock_movement",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    kind: stockMovementKindEnum("kind").notNull(),
    quantity: integer("quantity").notNull(),
    /** What the branch paid per unit, when known (received rows only). */
    unitCost: money("unit_cost"),
    /** The sale this row belongs to, for "sold" rows and their reversals. */
    saleId: uuid("sale_id").references(() => sale.id, { onDelete: "cascade" }),
    movedOn: date("moved_on").notNull(),
    note: text("note"),
    recordedBy: text("recorded_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("stock_movement_product_idx").on(table.productId, table.movedOn, table.createdAt), index("stock_movement_sale_idx").on(table.saleId)],
);

export const productRelations = relations(product, ({ many, one }) => ({
  movements: many(stockMovement),
  saleItems: many(saleItem),
  createdByUser: one(user, { fields: [product.createdBy], references: [user.id] }),
}));

export const saleRelations = relations(sale, ({ many, one }) => ({
  items: many(saleItem),
  movements: many(stockMovement),
  member: one(member, { fields: [sale.memberId], references: [member.id] }),
  soldByUser: one(user, { fields: [sale.soldBy], references: [user.id] }),
  voidedByUser: one(user, { fields: [sale.voidedBy], references: [user.id] }),
}));

export const saleItemRelations = relations(saleItem, ({ one }) => ({
  sale: one(sale, { fields: [saleItem.saleId], references: [sale.id] }),
  product: one(product, { fields: [saleItem.productId], references: [product.id] }),
}));

export const stockMovementRelations = relations(stockMovement, ({ one }) => ({
  product: one(product, { fields: [stockMovement.productId], references: [product.id] }),
  sale: one(sale, { fields: [stockMovement.saleId], references: [sale.id] }),
  recordedByUser: one(user, { fields: [stockMovement.recordedBy], references: [user.id] }),
}));

export type Product = typeof product.$inferSelect;
export type NewProduct = typeof product.$inferInsert;
export type Sale = typeof sale.$inferSelect;
export type NewSale = typeof sale.$inferInsert;
export type SaleItem = typeof saleItem.$inferSelect;
export type NewSaleItem = typeof saleItem.$inferInsert;
export type StockMovement = typeof stockMovement.$inferSelect;
export type NewStockMovement = typeof stockMovement.$inferInsert;
export type StockMovementKind = StockMovement["kind"];
export type PaymentMode = Sale["paymentMode"];
export type PriceLevel = Sale["priceLevel"];
