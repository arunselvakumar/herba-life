/**
 * Static placeholder data for the dashboard. Replace with real queries once the
 * domain schema lands.
 */

export type Trend = "up" | "down" | "flat";

export type Stat = {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend: Trend;
  hint: string;
};

export type OrderStatus = "fulfilled" | "processing" | "on-hold" | "cancelled";

export type Order = {
  id: string;
  distributor: string;
  region: string;
  items: number;
  total: number;
  status: OrderStatus;
  placedAt: string;
};

export type Distributor = {
  id: string;
  name: string;
  level: string;
  region: string;
  volumePoints: number;
  target: number;
};

export type MonthlySales = {
  month: string;
  retail: number;
  wholesale: number;
};

export const stats: readonly Stat[] = [
  {
    id: "revenue",
    label: "Net sales (MTD)",
    value: "$4.82M",
    delta: "+8.4%",
    trend: "up",
    hint: "vs. same period last month",
  },
  {
    id: "volume-points",
    label: "Volume points",
    value: "1.26M",
    delta: "+3.1%",
    trend: "up",
    hint: "across all regions",
  },
  {
    id: "active-distributors",
    label: "Active distributors",
    value: "18,402",
    delta: "-0.6%",
    trend: "down",
    hint: "30-day activity window",
  },
  {
    id: "orders",
    label: "Open orders",
    value: "742",
    delta: "0.0%",
    trend: "flat",
    hint: "awaiting fulfilment",
  },
];

export const monthlySales: readonly MonthlySales[] = [
  { month: "Nov", retail: 3.1, wholesale: 1.4 },
  { month: "Dec", retail: 3.6, wholesale: 1.5 },
  { month: "Jan", retail: 4.2, wholesale: 1.9 },
  { month: "Feb", retail: 3.8, wholesale: 1.7 },
  { month: "Mar", retail: 4.0, wholesale: 1.8 },
  { month: "Apr", retail: 4.4, wholesale: 2.0 },
  { month: "May", retail: 4.1, wholesale: 1.9 },
  { month: "Jun", retail: 4.6, wholesale: 2.1 },
  { month: "Jul", retail: 4.3, wholesale: 2.0 },
  { month: "Aug", retail: 4.7, wholesale: 2.2 },
  { month: "Sep", retail: 4.5, wholesale: 2.1 },
  { month: "Oct", retail: 4.8, wholesale: 2.3 },
];

export const recentOrders: readonly Order[] = [
  {
    id: "HL-104221",
    distributor: "Maria Castellanos",
    region: "Mexico",
    items: 14,
    total: 1289.5,
    status: "fulfilled",
    placedAt: "2026-10-26",
  },
  {
    id: "HL-104220",
    distributor: "Kwame Mensah",
    region: "Ghana",
    items: 6,
    total: 412.0,
    status: "processing",
    placedAt: "2026-10-26",
  },
  {
    id: "HL-104219",
    distributor: "Priya Raghunathan",
    region: "India",
    items: 22,
    total: 2034.75,
    status: "processing",
    placedAt: "2026-10-25",
  },
  {
    id: "HL-104218",
    distributor: "Lukas Berger",
    region: "Germany",
    items: 3,
    total: 189.9,
    status: "on-hold",
    placedAt: "2026-10-25",
  },
  {
    id: "HL-104217",
    distributor: "Aisha Rahman",
    region: "Malaysia",
    items: 9,
    total: 764.2,
    status: "fulfilled",
    placedAt: "2026-10-24",
  },
  {
    id: "HL-104216",
    distributor: "Daniel Okafor",
    region: "United States",
    items: 1,
    total: 58.0,
    status: "cancelled",
    placedAt: "2026-10-24",
  },
];

export const topDistributors: readonly Distributor[] = [
  {
    id: "d-1",
    name: "Sofia Almeida",
    level: "President's Team",
    region: "Brazil",
    volumePoints: 48200,
    target: 50000,
  },
  {
    id: "d-2",
    name: "Chen Wei",
    level: "Millionaire Team",
    region: "China",
    volumePoints: 36750,
    target: 40000,
  },
  {
    id: "d-3",
    name: "Olivia Hart",
    level: "GET Team",
    region: "United Kingdom",
    volumePoints: 21400,
    target: 30000,
  },
  {
    id: "d-4",
    name: "Mateo Fernández",
    level: "World Team",
    region: "Spain",
    volumePoints: 12900,
    target: 20000,
  },
];

export const regionMix: readonly { region: string; share: number }[] = [
  { region: "North America", share: 31 },
  { region: "Asia Pacific", share: 27 },
  { region: "EMEA", share: 22 },
  { region: "Latin America", share: 20 },
];

export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
