import { expect, test, type Browser, type Page } from "@playwright/test";

const ADMIN = {
  email: "admin@herbalife.local",
  password: "Herbalife2026!",
} as const;

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

async function signInAs(browser: Browser, email: string, password: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, email, password);
  return page;
}

test.describe("users and roles", () => {
  test("creates a role, a user on it, and the user only sees what the role allows", async ({ page, browser }) => {
    await signIn(page, ADMIN.email, ADMIN.password);

    const stamp = Date.now().toString().slice(-6);
    const roleName = `E2E desk ${stamp}`;
    const email = `e2e-${stamp}@herbalife.local`;
    const password = `Desk${stamp}!pass`;

    // A role that can see the dashboard and work with enquiries, nothing else.
    await page.goto("/team/roles/new");
    await page.getByLabel("Name", { exact: true }).fill(roleName);
    await page.getByLabel("Description", { exact: true }).fill("Playwright role");
    await page.getByTitle("Allow everything in Enquiries").click();
    // Dashboard view is preselected; Members stays off.
    await expect(page.getByText("7 of 29 allowed")).toBeVisible();
    await page.getByRole("button", { name: "Create role" }).click();
    await expect(page).toHaveURL(/\/team\/roles$/);
    await expect(page.getByText(roleName)).toBeVisible();

    // A user holding that role.
    await page.goto("/team/users/new");
    await page.getByLabel("Name", { exact: true }).fill(`E2E ${stamp}`);
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Role", { exact: true }).selectOption({ label: roleName });
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Create user" }).click();
    await expect(page).toHaveURL(/\/team\/users$/);
    await expect(page.getByText(email)).toBeVisible();

    // The new user signs in (separate browser context) and is fenced in.
    const staff = await signInAs(browser, email, password);
    await expect(staff).toHaveURL(/\/dashboard$/);
    const nav = staff.getByTestId("app-nav");
    await expect(nav.getByRole("link", { name: "Enquiries" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Members" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Team" })).toHaveCount(0);
    await staff.goto("/members");
    await expect(staff.getByText("You do not have access to this")).toBeVisible();
    await staff.goto("/inquiries");
    await expect(staff.getByRole("link", { name: "New enquiry" })).toBeVisible();

    // Suspending them ends their session.
    const row = page.getByRole("row", { name: new RegExp(email) });
    await row.getByRole("button", { name: "Suspend" }).click();
    await page.getByRole("button", { name: "Suspend" }).last().click();
    await expect(row.getByText("Suspended")).toBeVisible();

    const again = await staff.context().newPage();
    await again.goto("/login");
    await again.getByLabel("Email").fill(email);
    await again.getByLabel("Password").fill(password);
    await again.getByRole("button", { name: "Sign in" }).click();
    await expect(again.getByTestId("login-error")).toContainText("suspended");
    await staff.context().close();

    // Clean up: delete the user, then the role (now unused).
    await row.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete user" }).click();
    await expect(page.getByText(email)).toHaveCount(0);

    await page.goto("/team/roles");
    const roleRow = page.getByRole("row", { name: new RegExp(roleName) });
    await roleRow.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete" }).last().click();
    await expect(page.getByText(roleName)).toHaveCount(0);
  });

  test("protects the built-in Administrator role and the admin's own account", async ({ page }) => {
    await signIn(page, ADMIN.email, ADMIN.password);

    await page.goto("/team/roles");
    const adminRow = page.getByRole("row", { name: /Administrator/ });
    await expect(adminRow.getByText("Built in", { exact: true })).toBeVisible();
    await expect(adminRow.getByRole("button", { name: "Delete" })).toHaveCount(0);
    await adminRow.getByRole("link", { name: "View Administrator" }).click();
    await expect(page.getByText("always has every permission")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save changes" })).toHaveCount(0);

    await page.goto("/team/users");
    const me = page.getByRole("row", { name: /You/ });
    await expect(me.getByRole("button", { name: "Suspend" })).toHaveCount(0);
    await expect(me.getByRole("button", { name: "Delete" })).toHaveCount(0);
  });
});
