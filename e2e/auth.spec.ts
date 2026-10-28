import { expect, test } from "@playwright/test";

const ADMIN = {
  email: "admin@herbalife.local",
  password: "Herbalife2026!",
} as const;

test.describe("authentication", () => {
  test("redirects anonymous visitors to the login page", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
    await expect(
      page.getByRole("heading", { name: "Sign in to your account" }),
    ).toBeVisible();
  });

  test("rejects invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByTestId("login-error")).toContainText("not valid");
    await expect(page).toHaveURL(/\/login/);
  });

  test("signs in and lands on the dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: /good (morning|afternoon|evening)/i }),
    ).toBeVisible();
    await expect(page.getByTestId("app-nav")).toBeVisible();
  });

  test("signs out from the user menu", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByTestId("user-menu-trigger").click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
