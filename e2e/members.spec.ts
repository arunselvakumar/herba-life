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

test.describe("member management", () => {
  test("creates a package, enrols a member in it, records a follow-up, then cleans up", async ({ page }) => {
    await signIn(page);

    const stamp = Date.now().toString().slice(-6);
    const firstName = `Test${stamp}`;
    const planName = `E2E plan ${stamp}`;

    // Admin creates a package in the catalog.
    await page.goto("/packages/new");
    await page.getByLabel("Name").fill(planName);
    await page.getByLabel("Duration").fill("90");
    await page.getByLabel("Price").fill("12000");
    await page.getByRole("button", { name: "Create package" }).click();
    await expect(page).toHaveURL(/\/packages$/);
    await expect(page.getByText(planName)).toBeVisible();

    // Enrol a new member in that package from the join date.
    await page.goto("/members/new");
    await page.getByLabel("First name").fill(firstName);
    await page.getByLabel("Last name").fill("Playwright");
    await page.getByLabel("Gender").selectOption("female");
    await page.getByLabel("Joined on").fill("2026-10-01");
    await page.getByLabel("Mobile").fill(`9${stamp}0000`);
    await page.getByLabel("Height").fill("160");
    await page.getByLabel("Weight", { exact: true }).fill("70.5");
    await page.getByLabel("Body fat").fill("32");

    await page.getByText("Start a package now").click();
    await page.getByLabel("Package", { exact: true }).selectOption({ label: `${planName} · 90 days · ₹12,000` });
    await expect(page.getByLabel("Start date")).toHaveValue("2026-10-01");
    await expect(page.getByText("29 Dec 2026")).toBeVisible();
    await page.getByLabel("Advance paid").fill("5000");

    await page.getByRole("button", { name: "Save member" }).click();

    await expect(page).toHaveURL(/\/members\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: `${firstName} Playwright` })).toBeVisible();
    await expect(page.getByText(planName).first()).toBeVisible();
    await expect(page.getByText("until 29 Dec 2026")).toBeVisible();
    await expect(page.getByText("Baseline at enrolment")).toBeVisible();

    // Record a follow-up visit. The previous page stays mounted (hidden) for
    // instant back navigation, so scope to the follow-up form explicitly.
    const followUp = page.locator("form").filter({ has: page.getByRole("button", { name: "Save follow-up" }) });
    await followUp.getByLabel("Weight", { exact: true }).fill("69.2");
    await followUp.getByLabel("Remarks").fill("Feeling lighter");
    await followUp.getByRole("button", { name: "Save follow-up" }).click();
    await expect(page.getByText("Follow-up recorded.")).toBeVisible();
    await expect(page.getByText("Feeling lighter")).toBeVisible();
    await expect(page.getByText("2 visits recorded")).toBeVisible();

    // The member shows up in the list with their package.
    await page.goto(`/members?q=${firstName}`);
    await expect(page.getByRole("link", { name: `${firstName} Playwright`, exact: true })).toBeVisible();
    await expect(page.getByText("Active").first()).toBeVisible();

    // Clean up: delete the member, then the now-unused package.
    await page.getByRole("link", { name: `${firstName} Playwright`, exact: true }).click();
    await page.getByRole("button", { name: "Delete" }).first().click();
    await page.getByRole("button", { name: "Delete member" }).click();
    await expect(page).toHaveURL(/\/members$/);

    await page.goto("/packages");
    const row = page.getByRole("row").filter({ hasText: planName });
    await row.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete", exact: true }).last().click();
    await expect(page.getByText(planName)).toHaveCount(0);
  });

  test("shows validation errors instead of saving an empty member", async ({ page }) => {
    await signIn(page);
    await page.goto("/members/new");
    await page.getByRole("button", { name: "Save member" }).click();
    await expect(page.getByText("First name is required")).toBeVisible();
    await expect(page).toHaveURL(/\/members\/new$/);
  });
});
