import type { Product, Sale, SaleItem, StockMovement } from "@/db/schema";
import { fullName } from "@/lib/members/format";
import { stockState } from "@/lib/stock/format";
import type {
  MemberPickerOption,
  MemberRef,
  MovementRow,
  ProductDetail,
  ProductOption,
  SaleDetail,
  SaleListRow,
  StockDashboard,
  StockRow,
} from "@/lib/stock/queries";
import { memberRows } from "./members";
import { at, daysFromToday, TODAY } from "./time";
import { adminUser, frontDeskUser } from "./users";

// Ids are real UUIDs: the product and sale pages reject anything else with notFound().
let seq = 0;
const id = (prefix: string) => `${prefix}-0000-4000-8000-${String(++seq).padStart(12, "0")}`;

// ---------------------------------------------------------------------------
// Products

export function makeProduct(overrides: Partial<Product> & { onHand?: number } = {}): StockRow {
  const { onHand = 10, ...rest } = overrides;
  const p: Product = {
    id: id("5a6b7c8d"),
    stockNo: "0141",
    name: "Formula 1 Nutritional Shake Mix – Vanilla – 500 gms",
    category: "Weight management",
    volumePoints: 21.75,
    mrp: 2179,
    bronzePrice: 1899,
    silverPrice: 1713,
    goldPrice: 1526,
    reorderLevel: 4,
    isActive: true,
    sortOrder: 0,
    createdBy: adminUser.id,
    createdAt: at(-200, 9),
    updatedAt: at(-200, 9),
    ...rest,
  };
  return { ...p, onHand, state: stockState({ onHand, reorderLevel: p.reorderLevel, isActive: p.isActive }) };
}

export const vanilla = makeProduct({ onHand: 14 });
export const kulfi = makeProduct({ stockNo: "1172", name: "Formula 1 Nutritional Shake Mix – Kulfi – 500 gms", onHand: 3, sortOrder: 1 });
export const protein = makeProduct({
  stockNo: "0242",
  name: "Personalized Protein Powder – 400 gms",
  category: "Protein",
  volumePoints: 22.95,
  mrp: 2291,
  bronzePrice: 1997,
  silverPrice: 1801,
  goldPrice: 1605,
  reorderLevel: 2,
  onHand: 0,
  sortOrder: 2,
});
export const afresh = makeProduct({
  stockNo: "3146",
  name: "Afresh Energy Drink Mix – Lemon – 50 gms",
  category: "Energy and fitness",
  volumePoints: 6.9,
  mrp: 699,
  bronzePrice: 609,
  silverPrice: 549,
  goldPrice: 489,
  reorderLevel: 3,
  onHand: 9,
  sortOrder: 3,
});
/** No volume points and no preferred-customer prices: the "—" cells. */
export const aloe = makeProduct({
  stockNo: "1065",
  name: "Herbal Aloe Concentrate – Mango – 473 ml",
  category: "Digestive health",
  volumePoints: null,
  mrp: 2459,
  bronzePrice: null,
  silverPrice: null,
  goldPrice: null,
  reorderLevel: 2,
  onHand: 6,
  sortOrder: 4,
});
export const archivedBanana = makeProduct({
  stockNo: "0146",
  name: "Formula 1 Nutritional Shake Mix – Banana Caramel – 500 gms",
  isActive: false,
  onHand: 0,
  sortOrder: 5,
});

/** Active products in every shelf state: in stock, running low, out. */
export const stockRows: StockRow[] = [vanilla, kulfi, protein, afresh, aloe];
export const lowStockRows: StockRow[] = stockRows.filter((p) => p.state === "low" || p.state === "out");
export const archivedRows: StockRow[] = [archivedBanana];

export function toOption(p: StockRow): ProductOption {
  return {
    id: p.id,
    stockNo: p.stockNo,
    name: p.name,
    category: p.category,
    mrp: p.mrp,
    bronzePrice: p.bronzePrice,
    silverPrice: p.silverPrice,
    goldPrice: p.goldPrice,
    onHand: p.onHand,
  };
}

/** What the receive and sale pickers list: active products only. */
export const productOptions: ProductOption[] = stockRows.map(toOption);

export const categories: string[] = ["Weight management", "Protein", "Energy and fitness", "Digestive health", "Skin care"];

// ---------------------------------------------------------------------------
// Buyers

const [priya, rahul, fatima, george] = memberRows;
if (!priya || !rahul || !fatima || !george) throw new Error("fixtures/members.ts changed: expected at least four member rows");

const ref = (m: MemberRef): MemberRef => ({ id: m.id, serialNo: m.serialNo, firstName: m.firstName, lastName: m.lastName });

export const buyerOptions: MemberPickerOption[] = memberRows.map((m) => ({ ...ref(m), mobile: m.mobile }));
export const priyaId = priya.id;

// ---------------------------------------------------------------------------
// Sales

type SaleOverrides = Partial<Sale> & { member?: MemberRef | null; items?: SaleItem[]; soldByName?: string | null; voidedByName?: string | null };

function makeItem(saleId: string, p: StockRow, quantity: number, unitPrice: number): SaleItem {
  return {
    id: id("7c8d9e0f"),
    saleId,
    productId: p.id,
    stockNo: p.stockNo,
    name: p.name,
    quantity,
    unitPrice,
    lineTotal: Math.round(quantity * unitPrice * 100) / 100,
  };
}

function makeSale({ member = null, items = [], soldByName = frontDeskUser.name, voidedByName = null, ...overrides }: SaleOverrides): SaleDetail {
  const saleId = overrides.id ?? id("6b7c8d9e");
  const lines = items.map((i) => ({ ...i, saleId }));
  const total = overrides.total ?? lines.reduce((sum, i) => sum + i.lineTotal, 0);
  return {
    id: saleId,
    serialNo: 40,
    memberId: member?.id ?? null,
    buyerName: member ? fullName(member) : "Walk-in",
    soldOn: TODAY,
    priceLevel: "mrp",
    amountPaid: total,
    paymentMode: "cash",
    notes: null,
    voidedAt: null,
    voidReason: null,
    voidedBy: null,
    soldBy: frontDeskUser.id,
    createdAt: at(0, 10),
    updatedAt: at(0, 10),
    ...overrides,
    total,
    items: lines,
    member,
    soldByUser: soldByName ? { name: soldByName } : null,
    voidedByUser: voidedByName ? { name: voidedByName } : null,
  };
}

const s44 = id("6b7c8d9e");
const s43 = id("6b7c8d9e");
const s42 = id("6b7c8d9e");
const s41 = id("6b7c8d9e");
const s40 = id("6b7c8d9e");

/** Two products, member, paid in full by UPI, with a note. */
export const saleToday = makeSale({
  id: s44,
  serialNo: 44,
  member: ref(priya),
  soldOn: TODAY,
  paymentMode: "upi",
  notes: "Wants the chocolate flavour next time it comes in.",
  items: [makeItem(s44, vanilla, 2, 2179), makeItem(s44, afresh, 1, 699)],
  createdAt: at(0, 9, 45),
});

/** A walk-in buyer, one product, cash. */
export const walkInSale = makeSale({
  id: s43,
  serialNo: 43,
  buyerName: "Karthik Subramanian",
  soldOn: daysFromToday(-1),
  items: [makeItem(s43, aloe, 1, 2459)],
  soldByName: adminUser.name,
  soldBy: adminUser.id,
  createdAt: at(-1, 17, 20),
});

/** Silver prices, part paid: the balance-due case. */
export const balanceDueSale = makeSale({
  id: s42,
  serialNo: 42,
  member: ref(rahul),
  soldOn: daysFromToday(-3),
  priceLevel: "silver",
  amountPaid: 2000,
  items: [makeItem(s42, vanilla, 2, 1713)],
  createdAt: at(-3, 11, 5),
});

/** Voided the day after it was entered. */
export const voidedSale = makeSale({
  id: s41,
  serialNo: 41,
  member: ref(fatima),
  soldOn: daysFromToday(-10),
  items: [makeItem(s41, kulfi, 1, 2179)],
  voidedAt: at(-9, 12, 15),
  voidReason: "Entered twice",
  voidedBy: adminUser.id,
  voidedByName: adminUser.name,
  createdAt: at(-10, 18, 0),
});

/** Last month, gold prices, by card. */
export const lastMonthSale = makeSale({
  id: s40,
  serialNo: 40,
  member: ref(george),
  soldOn: daysFromToday(-40),
  priceLevel: "gold",
  paymentMode: "card",
  items: [makeItem(s40, protein, 1, 1605), makeItem(s40, vanilla, 3, 1526)],
  createdAt: at(-40, 10, 0),
});

export function toListRow(s: SaleDetail): SaleListRow {
  const { voidedByUser, ...rest } = s;
  void voidedByUser;
  return { ...rest, items: s.items.map(({ id: itemId, name, quantity }) => ({ id: itemId, name, quantity })) };
}

export const saleDetails: SaleDetail[] = [saleToday, walkInSale, balanceDueSale, voidedSale, lastMonthSale];
/** Newest first, the way `listSales` returns them; one voided, one with a balance. */
export const saleRows: SaleListRow[] = saleDetails.map(toListRow);
export const standingSaleRows: SaleListRow[] = saleRows.filter((s) => s.voidedAt === null);

/** Priya's purchases for her profile card: one standing, one part paid, one voided. */
export const memberSaleRows: SaleListRow[] = [
  toListRow(saleToday),
  toListRow(makeSale({ serialNo: 37, member: ref(priya), soldOn: daysFromToday(-21), amountPaid: 1000, items: [makeItem("", kulfi, 1, 2179)] })),
  toListRow(
    makeSale({
      serialNo: 31,
      member: ref(priya),
      soldOn: daysFromToday(-45),
      items: [makeItem("", afresh, 2, 699)],
      voidedAt: at(-45, 16),
      voidReason: "Wrong product",
      voidedBy: adminUser.id,
      voidedByName: adminUser.name,
    }),
  ),
];

// ---------------------------------------------------------------------------
// Movements and the product page

function makeMovement(overrides: Partial<StockMovement> & { sale?: MovementRow["sale"]; by?: string | null }): MovementRow {
  const { sale = null, by = adminUser.name, ...rest } = overrides;
  return {
    id: id("8d9e0f1a"),
    productId: vanilla.id,
    kind: "received",
    quantity: 1,
    unitCost: null,
    saleId: sale?.id ?? null,
    movedOn: TODAY,
    note: null,
    recordedBy: by ? adminUser.id : null,
    createdAt: at(0, 10),
    ...rest,
    recordedByUser: by ? { name: by } : null,
    sale,
  };
}

const saleRef = (s: SaleDetail): NonNullable<MovementRow["sale"]> => ({ id: s.id, serialNo: s.serialNo, buyerName: s.buyerName, voidedAt: s.voidedAt });

/**
 * Vanilla's ledger, newest first: a delivery, a sale, a voided sale and its
 * reversal, a damaged tin, the opening delivery. Sums to its 14 on hand.
 */
export const vanillaMovements: MovementRow[] = [
  makeMovement({ kind: "received", quantity: 12, unitCost: 1450, movedOn: daysFromToday(-1), note: "Invoice HL-2291" }),
  makeMovement({ kind: "sold", quantity: -2, movedOn: daysFromToday(-3), sale: saleRef(balanceDueSale), by: frontDeskUser.name }),
  makeMovement({ kind: "sold", quantity: 1, movedOn: daysFromToday(-9), sale: saleRef(voidedSale), note: "Sale #41 voided · Entered twice" }),
  makeMovement({ kind: "sold", quantity: -1, movedOn: daysFromToday(-10), sale: saleRef(voidedSale), by: frontDeskUser.name }),
  makeMovement({ kind: "adjustment", quantity: -1, movedOn: daysFromToday(-20), note: "Tin damaged in delivery" }),
  makeMovement({ kind: "received", quantity: 5, unitCost: 1450, movedOn: daysFromToday(-30), note: null, by: null }),
];

export const vanillaDetail: ProductDetail = { ...vanilla, movements: vanillaMovements, unitsSold: 2, hasHistory: true };

export const archivedDetail: ProductDetail = {
  ...archivedBanana,
  movements: [
    makeMovement({ productId: archivedBanana.id, kind: "adjustment", quantity: -2, movedOn: daysFromToday(-60), note: "Expired, thrown out" }),
    makeMovement({ productId: archivedBanana.id, kind: "received", quantity: 2, unitCost: 1450, movedOn: daysFromToday(-150) }),
  ],
  unitsSold: 0,
  hasHistory: true,
};

/** Added by hand and never stocked: can still be deleted. */
export const newProductDetail: ProductDetail = {
  ...makeProduct({ stockNo: "4466", name: "Herbal Tea Concentrate – Cinnamon – 51 gms", category: "Energy and fitness", volumePoints: 19.95, mrp: 1799, onHand: 0, sortOrder: 9 }),
  movements: [],
  unitsSold: 0,
  hasHistory: false,
};

// ---------------------------------------------------------------------------
// Dashboard

export const stockDashboard: StockDashboard = {
  products: stockRows.length,
  low: stockRows.filter((p) => p.state === "low").length,
  out: stockRows.filter((p) => p.state === "out").length,
  stockValue: stockRows.reduce((sum, p) => sum + Math.max(p.onHand, 0) * p.mrp, 0),
  salesThisMonth: 4,
  revenueThisMonth: standingSaleRows.filter((s) => s.soldOn >= `${TODAY.slice(0, 7)}-01`).reduce((sum, s) => sum + s.total, 0),
  salesLast30: 4,
  lowList: lowStockRows
    .slice()
    .sort((a, b) => a.onHand - b.onHand || a.name.localeCompare(b.name))
    .map(({ id: productId, stockNo, name, onHand, reorderLevel, state }) => ({ id: productId, stockNo, name, onHand, reorderLevel, state })),
};
