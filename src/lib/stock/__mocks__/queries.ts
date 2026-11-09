// Storybook mock for `queries.ts`, registered with sb.mock() in .storybook/preview.tsx.
// These read the database, so there is no sensible default: a story that renders
// a server component sets the data it needs, e.g.
//   beforeEach: () => { mocked(listStock).mockResolvedValue(fixture) }
import { fn } from "storybook/test";
import type * as Actual from "../queries";

function unset(name: string) {
  return async (): Promise<never> => {
    throw new Error(`queries.${name}() is not mocked in this story. Set it with mocked(${name}).mockResolvedValue(...).`);
  };
}

export const listStock: typeof Actual.listStock = fn(unset("listStock")).mockName("listStock");
export const listCategories: typeof Actual.listCategories = fn(unset("listCategories")).mockName("listCategories");
export const getProduct: typeof Actual.getProduct = fn(unset("getProduct")).mockName("getProduct");
export const listProductOptions: typeof Actual.listProductOptions = fn(unset("listProductOptions")).mockName("listProductOptions");
export const stockNoTaken: typeof Actual.stockNoTaken = fn(unset("stockNoTaken")).mockName("stockNoTaken");
export const listSales: typeof Actual.listSales = fn(unset("listSales")).mockName("listSales");
export const getSale: typeof Actual.getSale = fn(unset("getSale")).mockName("getSale");
export const listMemberSales: typeof Actual.listMemberSales = fn(unset("listMemberSales")).mockName("listMemberSales");
export const listBuyerOptions: typeof Actual.listBuyerOptions = fn(unset("listBuyerOptions")).mockName("listBuyerOptions");
export const getStockDashboard: typeof Actual.getStockDashboard = fn(unset("getStockDashboard")).mockName("getStockDashboard");
