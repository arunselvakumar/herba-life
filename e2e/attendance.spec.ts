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

test.describe("attendance", () => {
  test("a member checks in from the kiosk, is guarded against a double tap, and shows on the attendance page", async ({ page }) => {
    await signIn(page);

    // A fresh member so the cooldown guard cannot be tripped by earlier runs.
    const stamp = Date.now().toString().slice(-6);
    const firstName = `Kiosk${stamp}`;
    await page.goto("/members/new");
    await page.getByLabel("First name").fill(firstName);
    await page.getByLabel("Last name").fill("Visitor");
    await page.getByLabel("Joined on").fill("2026-10-01");
    await page.getByLabel("Mobile").fill(`8${stamp}4321`);
    await page.getByRole("button", { name: "Save member" }).click();
    await expect(page).toHaveURL(/\/members\/[0-9a-f-]{36}$/);
    const memberUrl = page.url();

    // Attendance Mode: search, tap, confirm.
    await page.goto("/attendance/kiosk");
    await expect(page.getByRole("heading", { name: "Welcome! Tap your name to check in." })).toBeVisible();
    await page.getByLabel("Find your name").fill(firstName);
    await page.getByRole("button", { name: `${firstName} Visitor` }).click();
    await page.getByRole("button", { name: "Yes, check me in" }).click();
    await expect(page.getByRole("heading", { name: `Welcome, ${firstName}!` })).toBeVisible();
    await expect(page.getByText("Visit 1 this month")).toBeVisible();

    // Tap anywhere to go back, then try again: still inside the cooldown.
    await page.getByRole("heading", { name: `Welcome, ${firstName}!` }).click();
    await page.getByLabel("Find your name").fill(firstName);
    await page.getByRole("button", { name: `${firstName} Visitor` }).click();
    await page.getByRole("button", { name: "Yes, check me in" }).click();
    await expect(page.getByRole("heading", { name: `You’re already in, ${firstName}` })).toBeVisible();
    await page.getByRole("heading", { name: `You’re already in, ${firstName}` }).click();

    // Leaving needs the staff password.
    await page.getByRole("button", { name: "Staff" }).click();
    await page.getByLabel("Password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Exit" }).click();
    await expect(page.getByText("That password is not right.")).toBeVisible();
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Exit" }).click();
    await expect(page).toHaveURL(/\/attendance$/);

    // The visit is in today's log exactly once.
    const log = page.getByRole("table").filter({ has: page.getByRole("columnheader", { name: "Time" }) });
    await expect(log.getByRole("link", { name: new RegExp(`${firstName} Visitor`) })).toHaveCount(1);

    // The member profile shows it too.
    await page.goto(memberUrl);
    await expect(page.getByText("Last visit today at")).toBeVisible();

    // Clean up: deleting the member removes the attendance with it.
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByRole("button", { name: "Delete member" }).click();
    await expect(page).toHaveURL(/\/members$/);
  });
});
