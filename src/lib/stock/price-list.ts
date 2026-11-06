/**
 * Herbalife International India "Inner & Outer Nutrition Product Price List –
 * Preferred Customers", effective 01-Nov-25. Prices are ₹ inclusive of GST.
 *
 * Seeded into the product table by `bun run db:seed` (idempotent on stock
 * number: products already there are left alone, so prices edited in the
 * console survive a re-seed). Safe to import from client components.
 */

export type PriceListEntry = {
  stockNo: string;
  name: string;
  category: string;
  volumePoints: number;
  mrp: number;
  bronze: number;
  silver: number;
  gold: number;
};

export const PRICE_LIST_EFFECTIVE_DATE = "2025-11-01";

const f1 = (stockNo: string, flavour: string): PriceListEntry => ({
  stockNo,
  name: `Formula 1 Nutritional Shake Mix – ${flavour} – 500 gms`,
  category: "Weight management",
  volumePoints: 21.75,
  mrp: 2179,
  bronze: 1899,
  silver: 1713,
  gold: 1526,
});

const f1Large = (stockNo: string, flavour: string): PriceListEntry => ({
  stockNo,
  name: `Formula 1 ${flavour} – 750 gms`,
  category: "Weight management",
  volumePoints: 32.65,
  mrp: 3227,
  bronze: 2813,
  silver: 2537,
  gold: 2261,
});

const afresh = (stockNo: string, flavour: string, grams = 50): PriceListEntry => ({
  stockNo,
  name: `Afresh Energy Drink Mix – ${flavour} – ${grams} gms`,
  category: "Energy products",
  volumePoints: 7.8,
  mrp: 812,
  bronze: 707,
  silver: 638,
  gold: 568,
});

const entry = (
  stockNo: string,
  name: string,
  category: string,
  volumePoints: number,
  mrp: number,
  bronze: number,
  silver: number,
  gold: number,
): PriceListEntry => ({ stockNo, name, category, volumePoints, mrp, bronze, silver, gold });

export const PRICE_LIST: readonly PriceListEntry[] = [
  f1("1247", "Vanilla"),
  f1("1248", "Chocolate"),
  f1("1249", "Mango"),
  f1("1269", "Orange Cream"),
  f1("1239", "Strawberry"),
  f1("4114", "Kulfi"),
  f1("082K", "Banana Caramel"),
  f1("154K", "Rose Kheer"),
  f1("287K", "Paan"),
  f1Large("406K", "Mango"),
  f1Large("407K", "Vanilla"),
  f1Large("408K", "Rose Kheer"),
  f1Large("409K", "Kulfi"),
  entry("1233", "Personalized Protein Powder – 200 gms", "Weight management", 11.5, 1295, 1129, 1018, 907),
  entry("1569", "Personalized Protein Powder – 400 gms", "Weight management", 22.5, 2485, 2166, 1953, 1741),
  entry("183K", "ShakeMate – 500 gms", "Weight management", 6.45, 653, 604, 572, 540),
  entry("507K", "Liftoff Watermelon (30 packets)", "Weight management", 38.05, 4119, 3590, 3238, 2886),
  entry("0064", "Ocular Defense", "Eye health", 19.25, 1927, 1679, 1515, 1350),
  entry("175K", "Male Factor +", "Men's health", 34.75, 3410, 2972, 2681, 2389),
  entry("127K", "Woman's Choice", "Women's health", 12.45, 1245, 1085, 978, 872),
  entry("109K", "vritilife Brain Health – 60 tablets", "Vritilife brain health", 15.1, 1464, 1276, 1151, 1026),
  entry("115K", "vritilife Immune Health – 60 tablets", "Vritilife immunity", 15.8, 1528, 1332, 1201, 1070),
  entry("275K", "vritilife Facial Cleanser (100 ml)", "Vritilife skin & body care", 10.4, 1165, 1015, 916, 816),
  entry("315K", "vritilife Facial Toner (100 ml)", "Vritilife skin & body care", 11.8, 1322, 1152, 1039, 926),
  entry("276K", "vritilife Facial Serum (30 ml)", "Vritilife skin & body care", 27.05, 3022, 2634, 2376, 2118),
  entry("277K", "vritilife Moisturizer (100 ml)", "Vritilife skin & body care", 13.15, 1473, 1284, 1158, 1032),
  entry("046K", "Hn-Skin Booster – Orange – 10 gms × 30 sachets", "Vritilife skin & body care", 38.65, 3910, 3476, 3188, 2899),
  entry("316K", "HN – Skin Booster Canister", "Vritilife skin & body care", 38.65, 3910, 3460, 3161, 2862),
  afresh("1291", "Ginger"),
  afresh("1294", "Elaichi"),
  afresh("1295", "Lemon"),
  afresh("230K", "Kashmiri Kahwa", 40),
  afresh("1296", "Peach"),
  afresh("1238", "Cinnamon"),
  entry("080K", "Afresh Energy Drink Mix – Tulsi (Basil) – 50 gms", "Energy products", 7.8, 812, 712, 646, 580),
  entry("1458", "H24 Hydrate – 5 gms × 20 sachets", "Sports nutrition", 14.05, 1636, 1457, 1338, 1219),
  entry("031K", "H24 Rebuild Strength – 50 gms × 10 sachets", "Sports nutrition", 24.7, 2616, 2295, 2081, 1868),
  entry("1279", "DinoShake – Chocolicious – 200 gms", "Children's health", 9.6, 1115, 971, 876, 780),
  entry("1236", "Dinoshake Nutritional Children's Drink Mix – Strawberry – 200 gms", "Children's health", 9.6, 1115, 971, 876, 780),
  entry("1278", "Activated Fiber – 90 tablets", "Digestive health", 15.75, 1636, 1426, 1286, 1146),
  entry("2865", "Active Fiber Complex – Unflavoured – 200 gms", "Digestive health", 22.95, 2559, 2231, 2012, 1793),
  entry("1293", "Aloe Plus – 60 capsules", "Digestive health", 9.4, 1059, 922, 832, 741),
  entry("0006", "Herbal Aloe Concentrate – Unflavored (Original) – 500 ml", "Digestive health", 24.95, 2696, 2350, 2119, 1889),
  entry("025K", "Simply Probiotic – 1 gm × 30 sachets", "Digestive health", 21.95, 2209, 1925, 1736, 1547),
  entry("186K", "Vritilife Triphala", "Digestive health", 11.25, 1089, 949, 856, 763),
  entry("0020", "Herbalife Calcium Tablets – 60 tablets", "Bone & joint health", 10.25, 1203, 1048, 945, 842),
  entry("0555", "Joint Support – 90 tablets", "Bone & joint health", 20.9, 2455, 2140, 1930, 1720),
  entry("2637", "Herbalife Niteworks – 300 gms", "Cardiovascular health", 75, 7128, 6213, 5604, 4994),
  entry("0065", "Herbalifeline – 60 softgels", "Cardiovascular health", 25.75, 2667, 2325, 2097, 1869),
  entry("051K", "Beta Heart – Vanilla Flavour – 15 gms × 15 sachets", "Cardiovascular health", 19.55, 2242, 1994, 1828, 1663),
  entry("1232", "Multivitamin Mineral & Herbal – 90 tablets", "Enhancers", 19.95, 2004, 1746, 1575, 1404),
  entry("3123", "Cell Activator – New – 60 tablets", "Enhancers", 21.95, 2215, 1930, 1741, 1551),
  entry("0111", "Cell-U-Loss Advanced – 90 tablets", "Enhancers", 15.75, 1705, 1486, 1340, 1194),
  entry("0077", "Herbal Control – 90 tablets", "Enhancers", 32.95, 3433, 2992, 2699, 2405),
  entry("426K", "Sleep Enhance", "Sleep support", 16.3, 1697, 1479, 1334, 1189),
];

/** The price-list sections in print order, for grouping and the category suggestions. */
export const PRICE_LIST_CATEGORIES: readonly string[] = [...new Set(PRICE_LIST.map((p) => p.category))];
