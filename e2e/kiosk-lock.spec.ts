import { expect, test, type Browser, type Page } from "@playwright/test";

/**
 * Attendance Mode locks the one sign-in (the one device) it was started on:
 * the server sends every admin page back to the kiosk and refuses everything
 * else, until the staff password is entered. Each test signs in fresh, so the
 * locks it leaves behind belong to sessions nobody uses again.
 */

const ADMIN = {
  email: "admin@herbalife.local",
  password: "Herbalife2026!",
} as const;

const KIOSK_URL = /\/attendance\/kiosk$/;
const WELCOME = "Welcome! Tap your name to check in.";

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** Another device signed in with the same account: a session of its own. */
async function signInElsewhere(browser: Browser): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page);
  return page;
}

/** Opens Attendance Mode and locks this sign-in to it. */
async function openKiosk(page: Page) {
  await page.goto("/attendance/kiosk");
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.getByRole("heading", { name: WELCOME })).toBeVisible();
}

async function expectOnKiosk(page: Page) {
  await expect(page).toHaveURL(KIOSK_URL);
  await expect(page.getByRole("heading", { name: WELCOME })).toBeVisible();
}

async function expectMembersList(page: Page) {
  await expect(page).toHaveURL(/\/members$/);
  await expect(page.getByRole("heading", { name: "Members", level: 1 })).toBeVisible();
}

/** Opens the exit dialog and submits `password`, waiting for the answer. */
async function tryExit(page: Page, password: string) {
  const dialog = page.getByRole("dialog", { name: "Leave Attendance Mode" });
  if (!(await dialog.isVisible())) await page.getByRole("button", { name: "Exit", exact: true }).click();
  const input = dialog.getByLabel("Password");
  await input.fill(password);
  await dialog.getByRole("button", { name: "Exit", exact: true }).click();
  return { dialog, input };
}

test.describe("Attendance Mode lock", () => {
  test("every admin page sends a locked device back to the kiosk", async ({ page }) => {
    await signIn(page);
    await openKiosk(page);
    for (const path of ["/", "/dashboard", "/members", "/team/users", "/login"]) {
      await page.goto(path);
      await expectOnKiosk(page);
    }
  });

  test("exports are refused while locked", async ({ page }) => {
    await signIn(page);
    await openKiosk(page);
    const response = await page.request.get("/api/export/members", { maxRedirects: 0 });
    expect(response.status()).toBe(403);
  });

  test("Better Auth's endpoints are closed to a locked device", async ({ page }) => {
    await signIn(page);
    await openKiosk(page);
    const response = await page.request.get("/api/auth/get-session");
    expect(response.status()).toBe(403);
    await expect(response.text()).resolves.not.toContain(ADMIN.email);
  });

  test("typing /signed-out does not sign the tablet out", async ({ page }) => {
    await signIn(page);
    await openKiosk(page);
    await page.goto("/signed-out");
    await expectOnKiosk(page);
    // Still signed in: a reload stays on the kiosk rather than the login page.
    await page.reload();
    await expectOnKiosk(page);
  });

  test("a second tab in the same browser is locked too", async ({ page }) => {
    await signIn(page);
    await openKiosk(page);
    const tab = await page.context().newPage();
    await tab.goto("/members");
    await expectOnKiosk(tab);
  });

  test("another device signed in with the same account keeps full access", async ({ page, browser }) => {
    await signIn(page);
    await openKiosk(page);

    const other = await signInElsewhere(browser);
    await other.goto("/members");
    await expectMembersList(other);
    await other.context().close();

    await page.goto("/members");
    await expectOnKiosk(page);
  });

  test("the Back button does not bring back the admin pages from before the lock", async ({ page }) => {
    await signIn(page);
    await page.goto("/members");
    await expectMembersList(page);
    await page.goto("/attendance");
    await page.getByRole("button", { name: "Attendance Mode" }).first().click();
    await expect(page).toHaveURL(KIOSK_URL);
    await page.getByRole("button", { name: "Start" }).click();
    await expect(page.getByRole("heading", { name: WELCOME })).toBeVisible();

    await page.goBack();
    await expectOnKiosk(page);
    await expect(page.getByRole("heading", { name: "Members", level: 1 })).toHaveCount(0);
    await expect(page.getByRole("table")).toHaveCount(0);
  });

  test("wrong exit passwords are throttled on the server", async ({ page }) => {
    await signIn(page);
    await openKiosk(page);

    for (let attempt = 1; attempt <= 5; attempt++) {
      const { dialog, input } = await tryExit(page, `wrong-${attempt}`);
      await expect(input).toHaveValue("");
      await expect(dialog.getByRole("alert")).toHaveText("That password is not right. Try again.");
    }

    // The sixth try is refused before the password is even checked, right one or not.
    const { dialog, input } = await tryExit(page, ADMIN.password);
    await expect(input).toHaveValue("");
    await expect(dialog.getByRole("alert")).toContainText("Too many wrong passwords. Try again in");
    await expect(page).toHaveURL(KIOSK_URL);

    await page.goto("/members");
    await expectOnKiosk(page);
  });

  test("the right password unlocks this device", async ({ page }) => {
    await signIn(page);
    await openKiosk(page);
    await tryExit(page, ADMIN.password);
    await expect(page).toHaveURL(/\/attendance$/);

    await page.goto("/members");
    await expectMembersList(page);
  });
});
