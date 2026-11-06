# Stock module – requirements

Status: implemented (first version). Open questions are listed at the end.

## 1. Purpose

Besides the programmes (packages) it sells, the branch keeps Herbalife
products on the shelf: Formula 1 shake mixes, protein powder, Afresh energy
drink mixes, supplements and skin care. Products are bought from Herbalife,
kept in stock, and sold to members (and the occasional walk-in) when they ask
for them. Today that is tracked by hand.

The stock module records **what the branch sells** (the product catalog with
its prices), **how many of each are on the shelf** (a running stock ledger),
and **every sale** (who bought what, at which price, and how much they paid).
From that it can say what is running low, how much stock is sitting on the
shelf and what was sold this month.

## 2. Users

- **Staff**: see stock, receive deliveries, sell products.
- **Administrators**: everything staff can do, plus maintain the product
  catalog and prices, correct stock counts, void sales and export.

## 3. Product catalog

One record per product on Herbalife's price list. The first version is seeded
from the *Inner & Outer Nutrition Product Price List – Preferred Customers,
effective 01-Nov-25* (55 products, 16 categories; the full list is in §11).

| Field | Notes |
| --- | --- |
| Stock number | Herbalife's code, e.g. `1247`, `082K`. Unique; printed on the box and the invoice. |
| Name | As on the price list, e.g. "Formula 1 Nutritional Shake Mix – Vanilla – 500 gms". |
| Category | One of the price-list sections (Weight management, Energy products, Digestive health, …). Free text with suggestions, so a new section needs no code change. |
| Volume points | From the price list; informational, shown on the product. |
| MRP | Maximum retail price, inclusive of GST. |
| Bronze / Silver / Gold price | The three preferred-customer prices from the list. |
| Reorder level | Below this on-hand count the product shows as "running low". Default 2. |
| Active | Archived products stay on old sales but cannot be received or sold. |

Prices live on the product and are edited in place when a new price list
arrives. Every sale copies the unit price onto the sale line, so a later
price change never rewrites history (the same rule as packages → enrolments).

## 4. Stock ledger

Stock is never edited directly. Every change is a **movement** row, and the
on-hand count of a product is the sum of its movements:

| Kind | Quantity | When |
| --- | --- | --- |
| Received | + | A delivery from Herbalife is put on the shelf. Records product, quantity, date, optional unit cost and note (invoice number, order number). The dialog stays open after each save so a whole delivery can be keyed in line by line. |
| Sold | − | A line on a sale (§5). Written by the sale, never by hand. |
| Adjustment | + or − | A correction: physical count differed, item damaged or expired, free sample given out. A reason is required. |

Each movement records who made it and when. A ledger (instead of a mutable
"quantity" column) gives a history per product, lets a sale be voided by
reversing it, and makes "how did we get to 3?" answerable.

On hand can never go below zero: a sale or negative adjustment that would do
so is refused with the current count.

## 5. Sales

A **sale** is one visit to the counter: a buyer, one or more products, and a
payment.

| Field | Notes |
| --- | --- |
| Number | Auto-incrementing `#`, like members and enquiries. |
| Buyer | An existing member (searchable), or a free-text name for a walk-in. |
| Sold on | Date, defaults to today. |
| Price level | Which column of the price list applies to this buyer: MRP (default), Bronze, Silver or Gold. Fills every line's unit price; each line stays editable. |
| Lines | Product, quantity, unit price, line total. The picker shows on-hand and greys out products that are out of stock. |
| Total | Sum of the lines. |
| Amount paid | Defaults to the total. Less than the total leaves a balance shown on the sale and the member's profile. |
| Payment mode | Cash, UPI, card, other. |
| Notes | Free text. |

Saving a sale writes the sale, its lines and one "sold" movement per line in
a single transaction. A sale can be **voided** (reason required): it stays
visible as voided and its movements are reversed, so stock comes back. Sales
are never edited after saving; void and re-enter.

A member's profile gets a **Purchases** card: their recent sales with totals
and any balance, and a "Sell products" button that opens the sale form with
the member already chosen.

## 6. Screens

| Route | Screen |
| --- | --- |
| `/stock` | Stock on hand: every active product grouped by category with on-hand count, MRP, and a "Running low" / "Out of stock" badge. Search by name or stock number; filters: All, Running low, Out of stock. Actions: Receive stock, New sale, Export. |
| `/stock/[id]` | Product: prices, on hand, reorder level, and the movement history (newest first, with who recorded each). Actions: Receive, Adjust, Edit product, Archive. |
| `/stock/products/new`, `/stock/products/[id]/edit` | Product form (administrators). |
| `/stock/sales` | Sales list, newest first: number, buyer, items, total, paid, balance, voided. Search by buyer or number; filter by month. |
| `/stock/sales/new` | New sale form (§5). Opened from Stock, Sales, or a member's profile. |
| `/stock/sales/[id]` | The sale as a receipt: buyer, lines, total, paid, balance, who sold it. Void. |

Navigation gets a **Stock** pill. The dashboard gets "Products running
low" (count, linking to the filtered stock page) and "Sales this month"
(count and amount) tiles.

## 7. Permissions

| Permission | Unlocks |
| --- | --- |
| `stock.view` | The stock pages, product histories and the sales list. |
| `stock.receive` | Receive stock. |
| `stock.sell` | Create sales. |
| `stock.adjust` | Adjustments and voiding sales. |
| `stock.products` | Create, edit and archive products and prices. |
| `stock.delete` | Delete a product nobody has ever stocked or sold. |
| `stock.export` | Export to Excel. |

The default Staff role gets view, receive and sell. Administrators hold
everything, as always.

## 8. Export

A **Stock** workbook with four sheets: Products (catalog with prices and
on-hand), Stock movements, Sales, Sale items. It joins the other workbooks on
the Backup & export page and inside "Download everything".

## 9. Rules

- Stock numbers are unique and case-insensitive (`082k` is `082K`).
- Quantities are whole numbers; prices have two decimals.
- A product with movements or sales cannot be deleted, only archived.
- Deleting a member keeps their sales; the buyer shows as the name at the
  time of sale.
- Voiding a sale when some of its stock has since been sold again still
  succeeds (the ledger simply adds the quantity back).

## 10. Non-goals (for now)

- Purchase orders to Herbalife, and tracking what has been ordered but not
  yet delivered.
- Uploading a new price-list PDF to update prices automatically; prices are
  edited on the product.
- GST breakdown on receipts; prices are stored as printed, inclusive of GST.
- Batch or expiry-date tracking per unit.
- Printing receipts.

## 11. Seed: price list effective 01-Nov-25

Prices are ₹, inclusive of GST. VP = volume points.

| Stock No | Product | Category | VP | MRP | Bronze | Silver | Gold |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1247 | Formula 1 Nutritional Shake Mix – Vanilla – 500 gms | Weight management | 21.75 | 2179 | 1899 | 1713 | 1526 |
| 1248 | Formula 1 Nutritional Shake Mix – Chocolate – 500 gms | Weight management | 21.75 | 2179 | 1899 | 1713 | 1526 |
| 1249 | Formula 1 Nutritional Shake Mix – Mango – 500 gms | Weight management | 21.75 | 2179 | 1899 | 1713 | 1526 |
| 1269 | Formula 1 Nutritional Shake Mix – Orange Cream – 500 gms | Weight management | 21.75 | 2179 | 1899 | 1713 | 1526 |
| 1239 | Formula 1 Nutritional Shake Mix – Strawberry – 500 gms | Weight management | 21.75 | 2179 | 1899 | 1713 | 1526 |
| 4114 | Formula 1 Nutritional Shake Mix – Kulfi – 500 gms | Weight management | 21.75 | 2179 | 1899 | 1713 | 1526 |
| 082K | Formula 1 Nutritional Shake Mix – Banana Caramel – 500 gms | Weight management | 21.75 | 2179 | 1899 | 1713 | 1526 |
| 154K | Formula 1 Nutritional Shake Mix – Rose Kheer – 500 gms | Weight management | 21.75 | 2179 | 1899 | 1713 | 1526 |
| 287K | Formula 1 Nutritional Shake Mix – Paan – 500 gms | Weight management | 21.75 | 2179 | 1899 | 1713 | 1526 |
| 406K | Formula 1 Mango – 750 gms | Weight management | 32.65 | 3227 | 2813 | 2537 | 2261 |
| 407K | Formula 1 Vanilla – 750 gms | Weight management | 32.65 | 3227 | 2813 | 2537 | 2261 |
| 408K | Formula 1 Rose Kheer – 750 gms | Weight management | 32.65 | 3227 | 2813 | 2537 | 2261 |
| 409K | Formula 1 Kulfi – 750 gms | Weight management | 32.65 | 3227 | 2813 | 2537 | 2261 |
| 1233 | Personalized Protein Powder – 200 gms | Weight management | 11.50 | 1295 | 1129 | 1018 | 907 |
| 1569 | Personalized Protein Powder – 400 gms | Weight management | 22.50 | 2485 | 2166 | 1953 | 1741 |
| 183K | ShakeMate – 500 gms | Weight management | 6.45 | 653 | 604 | 572 | 540 |
| 507K | Liftoff Watermelon (30 packets) | Weight management | 38.05 | 4119 | 3590 | 3238 | 2886 |
| 0064 | Ocular Defense | Eye health | 19.25 | 1927 | 1679 | 1515 | 1350 |
| 175K | Male Factor + | Men's health | 34.75 | 3410 | 2972 | 2681 | 2389 |
| 127K | Woman's Choice | Women's health | 12.45 | 1245 | 1085 | 978 | 872 |
| 109K | vritilife Brain Health – 60 tablets | Vritilife brain health | 15.10 | 1464 | 1276 | 1151 | 1026 |
| 115K | vritilife Immune Health – 60 tablets | Vritilife immunity | 15.80 | 1528 | 1332 | 1201 | 1070 |
| 275K | vritilife Facial Cleanser (100 ml) | Vritilife skin & body care | 10.40 | 1165 | 1015 | 916 | 816 |
| 315K | vritilife Facial Toner (100 ml) | Vritilife skin & body care | 11.80 | 1322 | 1152 | 1039 | 926 |
| 276K | vritilife Facial Serum (30 ml) | Vritilife skin & body care | 27.05 | 3022 | 2634 | 2376 | 2118 |
| 277K | vritilife Moisturizer (100 ml) | Vritilife skin & body care | 13.15 | 1473 | 1284 | 1158 | 1032 |
| 046K | Hn-Skin Booster – Orange – 10 gms × 30 sachets | Vritilife skin & body care | 38.65 | 3910 | 3476 | 3188 | 2899 |
| 316K | HN – Skin Booster Canister | Vritilife skin & body care | 38.65 | 3910 | 3460 | 3161 | 2862 |
| 1291 | Afresh Energy Drink Mix – Ginger – 50 gms | Energy products | 7.80 | 812 | 707 | 638 | 568 |
| 1294 | Afresh Energy Drink Mix – Elaichi – 50 gms | Energy products | 7.80 | 812 | 707 | 638 | 568 |
| 1295 | Afresh Energy Drink Mix – Lemon – 50 gms | Energy products | 7.80 | 812 | 707 | 638 | 568 |
| 230K | Afresh Energy Drink Mix – Kashmiri Kahwa – 40 gms | Energy products | 7.80 | 812 | 707 | 638 | 568 |
| 1296 | Afresh Energy Drink Mix – Peach – 50 gms | Energy products | 7.80 | 812 | 707 | 638 | 568 |
| 1238 | Afresh Energy Drink Mix – Cinnamon – 50 gms | Energy products | 7.80 | 812 | 707 | 638 | 568 |
| 080K | Afresh Energy Drink Mix – Tulsi (Basil) – 50 gms | Energy products | 7.80 | 812 | 712 | 646 | 580 |
| 1458 | H24 Hydrate – 5 gms × 20 sachets | Sports nutrition | 14.05 | 1636 | 1457 | 1338 | 1219 |
| 031K | H24 Rebuild Strength – 50 gms × 10 sachets | Sports nutrition | 24.70 | 2616 | 2295 | 2081 | 1868 |
| 1279 | DinoShake – Chocolicious – 200 gms | Children's health | 9.60 | 1115 | 971 | 876 | 780 |
| 1236 | Dinoshake Nutritional Children's Drink Mix – Strawberry – 200 gms | Children's health | 9.60 | 1115 | 971 | 876 | 780 |
| 1278 | Activated Fiber – 90 tablets | Digestive health | 15.75 | 1636 | 1426 | 1286 | 1146 |
| 2865 | Active Fiber Complex – Unflavoured – 200 gms | Digestive health | 22.95 | 2559 | 2231 | 2012 | 1793 |
| 1293 | Aloe Plus – 60 capsules | Digestive health | 9.40 | 1059 | 922 | 832 | 741 |
| 0006 | Herbal Aloe Concentrate – Unflavored (Original) – 500 ml | Digestive health | 24.95 | 2696 | 2350 | 2119 | 1889 |
| 025K | Simply Probiotic – 1 gm × 30 sachets | Digestive health | 21.95 | 2209 | 1925 | 1736 | 1547 |
| 186K | Vritilife Triphala | Digestive health | 11.25 | 1089 | 949 | 856 | 763 |
| 0020 | Herbalife Calcium Tablets – 60 tablets | Bone & joint health | 10.25 | 1203 | 1048 | 945 | 842 |
| 0555 | Joint Support – 90 tablets | Bone & joint health | 20.90 | 2455 | 2140 | 1930 | 1720 |
| 2637 | Herbalife Niteworks – 300 gms | Cardiovascular health | 75.00 | 7128 | 6213 | 5604 | 4994 |
| 0065 | Herbalifeline – 60 softgels | Cardiovascular health | 25.75 | 2667 | 2325 | 2097 | 1869 |
| 051K | Beta Heart – Vanilla Flavour – 15 gms × 15 sachets | Cardiovascular health | 19.55 | 2242 | 1994 | 1828 | 1663 |
| 1232 | Multivitamin Mineral & Herbal – 90 tablets | Enhancers | 19.95 | 2004 | 1746 | 1575 | 1404 |
| 3123 | Cell Activator – New – 60 tablets | Enhancers | 21.95 | 2215 | 1930 | 1741 | 1551 |
| 0111 | Cell-U-Loss Advanced – 90 tablets | Enhancers | 15.75 | 1705 | 1486 | 1340 | 1194 |
| 0077 | Herbal Control – 90 tablets | Enhancers | 32.95 | 3433 | 2992 | 2699 | 2405 |
| 426K | Sleep Enhance | Sleep support | 16.30 | 1697 | 1479 | 1334 | 1189 |

## 12. Code layout

Follows the other modules: `src/db/stock-schema.ts` (tables `product`,
`stock_movement`, `sale`, `sale_item`), `src/lib/stock/` (validation,
queries, server actions, the seed list), `src/components/stock/`,
`src/app/(app)/stock/`, a `Stock` entry in `src/lib/access/permissions.ts`,
`src/components/app/nav-config.ts` and `src/lib/export/catalog.ts`, a
migration `drizzle/0006_stock.sql`, and the seed wired into `bun run db:seed`
(idempotent on stock number, so re-running never duplicates).

## 13. Open questions

1. **Which price does the branch sell at?** The proposal defaults a sale to
   MRP with Bronze / Silver / Gold selectable per sale. If the branch always
   sells at one level, or has its own price, that becomes the default and the
   selector can go.
2. **Cost price.** The price list has no distributor cost. Recording a unit
   cost when stock is received would allow margin and stock-value reports.
   The proposal makes it optional; is it worth asking staff for?
3. **Partial payments.** Should a balance owed be tracked and settled later
   (a "Record payment" on the sale), or is amount paid just a note?
4. **Walk-in buyers.** Is a free-text name enough, or should every buyer be a
   member or an enquiry?
5. **Package bundles.** Do packages include products (e.g. a 3-month package
   comes with two Formula 1 tins) that should come out of stock on
   enrolment?
