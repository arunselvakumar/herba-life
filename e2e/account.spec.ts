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

test.describe("own account", () => {
  // A throwaway user, so the seeded admin's password never changes under other specs.
  test("a user changes their own password from the user menu", async ({ page, browser }) => {
    await signIn(page, ADMIN.email, ADMIN.password);

    const stamp = Date.now().toString().slice(-6);
    const email = `e2e-pw-${stamp}@herbalife.local`;
    const oldPassword = `Old${stamp}!pass`;
    const newPassword = `New${stamp}!pass`;

    await page.goto("/team/users/new");
    await page.getByLabel("Name", { exact: true }).fill(`E2E password ${stamp}`);
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Role", { exact: true }).selectOption({ label: "Staff" });
    await page.getByLabel("Password", { exact: true }).fill(oldPassword);
    await page.getByRole("button", { name: "Create user" }).click();
    await expect(page).toHaveURL(/\/team\/users$/);

    // Signed in on a second device, which the change should sign out.
    const otherDevice = await signInAs(browser, email, oldPassword);

    const staff = await signInAs(browser, email, oldPassword);
    await staff.getByTestId("user-menu-trigger").click();
    await staff.getByRole("menuitem", { name: "Change password" }).click();
    const dialog = staff.getByRole("dialog", { name: "Change password" });
    await expect(dialog).toBeVisible();

    await dialog.getByLabel("New password", { exact: true }).fill("short");
    await dialog.getByLabel("Re-enter new password").fill("short");
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(dialog.getByText("Use at least 8 characters")).toBeVisible();

    await dialog.getByLabel("New password", { exact: true }).fill(newPassword);
    await dialog.getByLabel("Re-enter new password").fill(`${newPassword}x`);
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(dialog.getByText("The passwords do not match")).toBeVisible();

    await dialog.getByLabel("New password", { exact: true }).fill(newPassword);
    await dialog.getByLabel("Re-enter new password").fill(newPassword);
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(dialog.getByText("Your password has been changed.")).toBeVisible();
    await expect(dialog).toBeHidden();

    // This device keeps its session; the other one loses it. Pages trust the
    // session cookie cache for a few minutes, so ask the session store directly.
    const sessionOf = (p: Page) => p.request.get("/api/auth/get-session?disableCookieCache=true").then((r) => r.json());
    expect(await sessionOf(staff)).toMatchObject({ user: { email } });
    expect(await sessionOf(otherDevice)).toBeNull();

    // Only the new password works now.
    await otherDevice.context().clearCookies();
    await otherDevice.goto("/login");
    await otherDevice.getByLabel("Email", { exact: true }).fill(email);
    await otherDevice.getByLabel("Password", { exact: true }).fill(oldPassword);
    await otherDevice.getByRole("button", { name: "Sign in" }).click();
    await expect(otherDevice).toHaveURL(/\/login/);
    await signIn(otherDevice, email, newPassword);

    await staff.context().close();
    await otherDevice.context().close();
  });
});
