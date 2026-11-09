// Storybook mock for `actions.ts`, registered with sb.mock() in .storybook/preview.tsx.
// Each export is a spy that resolves to a harmless default; a story overrides it with
// `mocked(createProduct).mockResolvedValue(...)` and asserts on the calls.
import { fn } from "storybook/test";
import type * as Actual from "../actions";

const saved = async () => ({ status: "success" as const, message: "Saved." });

export const createProduct: typeof Actual.createProduct = fn(saved).mockName("createProduct");
export const updateProduct: typeof Actual.updateProduct = fn(saved).mockName("updateProduct");
export const setProductActive: typeof Actual.setProductActive = fn(async () => {}).mockName("setProductActive");
export const deleteProduct: typeof Actual.deleteProduct = fn(async () => {}).mockName("deleteProduct");
export const receiveStock: typeof Actual.receiveStock = fn(saved).mockName("receiveStock");
export const adjustStock: typeof Actual.adjustStock = fn(saved).mockName("adjustStock");
export const createSale: typeof Actual.createSale = fn(saved).mockName("createSale");
export const voidSale: typeof Actual.voidSale = fn(saved).mockName("voidSale");
