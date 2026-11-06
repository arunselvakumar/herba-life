import { expect, test, type Page } from "@playwright/test";

const ADMIN = {
  email: "admin@herbalife.local",
  password: "Herbalife2026!",
} as const;

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe("stock", () => {
  test("creates a product, receives stock, sells some, voids the sale, then archives the product", async ({ page }) => {
    await signIn(page);

    const stamp = Date.now().toString().slice(-6);
    const stockNo = `E2E${stamp}`;
    const name = `E2E Test Tin ${stamp}`;
    const buyer = `Walk-in ${stamp}`;

    // A product of its own, so the seeded catalog's counts are never touched.
    await page.goto("/stock/products/new");
    await page.getByLabel("Stock number").fill(stockNo);
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Category").fill("E2E");
    await page.getByLabel("MRP").fill("1000");
    await page.getByLabel("Bronze").fill("900");
    await page.getByRole("button", { name: "Create product" }).click();

    await expect(page).toHaveURL(/\/stock\/[0-9a-f-]{36}$/);
    const productUrl = page.url();
    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(page.getByText("Out of stock")).toBeVisible();

    // Receive a delivery of five. The product is locked in the dialog.
    await page.getByRole("button", { name: "Receive stock" }).click();
    const receive = page.getByRole("dialog");
    await receive.getByLabel("Quantity").fill("5");
    await receive.getByLabel("Note").fill("E2E delivery");
    await receive.getByRole("button", { name: "Add to stock" }).click();
    await expect(receive.getByText(`Added 5 × ${name} to stock.`)).toBeVisible();
    await receive.getByRole("button", { name: "Done" }).click();
    await expect(page.getByText("In stock")).toBeVisible();
    await expect(page.getByText("E2E delivery")).toBeVisible();

    // Sell two to a walk-in at MRP, partly paid.
    await page.getByRole("link", { name: "Sell" }).click();
    await expect(page).toHaveURL(/\/stock\/sales\/new\?product=/);
    await expect(page.getByLabel("Unit price")).toHaveValue("1000");
    await page.getByLabel("Buyer's name").fill(buyer);
    await page.getByLabel("Qty").fill("2");
    await page.getByLabel("Amount paid").fill("1500");
    await expect(page.getByText("Balance due ₹500")).toBeVisible();
    await page.getByRole("button", { name: "Save sale" }).click();

    await expect(page).toHaveURL(/\/stock\/sales\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: /^Sale #\d+$/ })).toBeVisible();
    await expect(page.getByText(buyer)).toBeVisible();
    await expect(page.getByText("₹2,000").first()).toBeVisible();
    await expect(page.getByText("Balance due")).toBeVisible();

    // The shelf went from five to three.
    await page.goto(productUrl);
    await expect(page.getByText("Sold", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Running low at 2 or fewer · 2 sold so far")).toBeVisible();

    // Voiding the sale puts both units back. The dialog unmounts as soon as
    // the page re-renders voided, so assert on the receipt rather than on it.
    await page.goBack();
    await page.getByRole("button", { name: "Void sale" }).click();
    const voiding = page.getByRole("dialog");
    await voiding.getByLabel("Reason").fill("E2E reversal");
    await voiding.getByRole("button", { name: "Void sale" }).click();
    await expect(page.getByText("E2E reversal. Every unit went back on the shelf.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Void sale" })).toHaveCount(0);

    await page.goto(productUrl);
    await expect(page.getByText("Returned to shelf")).toBeVisible();
    await expect(page.getByText("Running low at 2 or fewer · 0 sold so far")).toBeVisible();

    // A product with history cannot be deleted, so archive it to keep the catalog tidy.
    await page.getByRole("button", { name: "Archive" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Archive" }).click();
    await expect(page.getByText("Archived").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Receive stock" })).toHaveCount(0);
  });
});
