import { expect, test, type Browser, type Page } from "@playwright/test";
import { LOW_VISITS_THRESHOLD } from "../src/lib/members/constants";
import { toDay } from "../src/lib/members/dates";
import { isUsable, packageState, pickCurrentPackage, visitsLeft } from "../src/lib/members/format";

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

/** Another device signed in with the same account: its own session, never locked by this one. */
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
  await expect(page.getByRole("heading", { name: "Welcome! Tap your name to check in." })).toBeVisible();
}

/** Leaves Attendance Mode with the staff password, back on the attendance page. */
async function exitKiosk(page: Page) {
  await page.getByRole("button", { name: "Exit", exact: true }).click();
  await page.getByLabel("Password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Exit", exact: true }).click();
  await expect(page).toHaveURL(/\/attendance$/);
}

async function createPlan(page: Page, name: string, visits = 90) {
  await page.goto("/packages/new");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Visits").fill(String(visits));
  await page.getByLabel("Price").fill("12000");
  await page.getByRole("button", { name: "Create package" }).click();
  await expect(page).toHaveURL(/\/packages$/);
}

async function deletePlan(page: Page, name: string) {
  await page.goto("/packages");
  await page.getByRole("row").filter({ hasText: name }).getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).last().click();
  await expect(page.getByText(name)).toHaveCount(0);
}

/** Adds a member joining today, enrolled in `planName` if one is given, and returns their profile URL. */
async function createMember(
  page: Page,
  member: { firstName: string; lastName: string; mobile: string; planName?: string; visits?: number },
): Promise<string> {
  await page.goto("/members/new");
  await page.getByLabel("First name").fill(member.firstName);
  await page.getByLabel("Last name").fill(member.lastName);
  await page.getByLabel("Joined on").fill(toDay(new Date()));
  await page.getByLabel("Mobile").fill(member.mobile);
  if (member.planName) {
    await page.getByText("Start a package now").click();
    await page.getByLabel("Package", { exact: true }).selectOption({ label: `${member.planName} · ${member.visits ?? 90} visits · ₹12,000` });
  }
  await page.getByRole("button", { name: "Save member" }).click();
  await expect(page).toHaveURL(/\/members\/[0-9a-f-]{36}$/);
  return page.url();
}

async function deleteMember(page: Page, url: string) {
  await page.goto(url);
  await page.getByRole("button", { name: "Delete", exact: true }).first().click();
  await page.getByRole("button", { name: "Delete member" }).click();
  await expect(page).toHaveURL(/\/members$/);
}

const SEARCH = "Search by name, mobile or member number";

test.describe("attendance", () => {
  test("a member checks in once a day: the visit comes off the package, and a second check-in is refused", async ({ page }) => {
    await signIn(page);

    // A fresh member, so nobody has checked them in today already.
    const stamp = Date.now().toString().slice(-6);
    const firstName = `Kiosk${stamp}`;
    const planName = `Kiosk plan ${stamp}`;
    await createPlan(page, planName);
    const memberUrl = await createMember(page, { firstName, lastName: "Visitor", mobile: `8${stamp}4321`, planName });

    // Attendance Mode: search, tap, confirm.
    await openKiosk(page);
    await page.getByLabel(SEARCH).fill(firstName);
    await page.getByRole("button", { name: `${firstName} Visitor` }).click();
    await page.getByRole("button", { name: "Yes, check me in" }).click();
    await expect(page.getByRole("heading", { name: `Welcome, ${firstName}!` })).toBeVisible();
    await expect(page.getByText("Visit this month")).toBeVisible();
    await expect(page.getByText("1st", { exact: true })).toBeVisible();
    // The visit came off the package: 90 visits, one used.
    await expect(page.getByText("89 visits left", { exact: true })).toBeVisible();

    // Tap anywhere to go back, then try again: one visit a day.
    await page.getByRole("heading", { name: `Welcome, ${firstName}!` }).click();
    await page.getByLabel(SEARCH).fill(firstName);
    await page.getByRole("button", { name: `${firstName} Visitor` }).click();
    await expect(page.getByRole("dialog").getByText(/89 visits left/)).toBeVisible();
    await page.getByRole("button", { name: "Yes, check me in" }).click();
    await expect(page.getByRole("heading", { name: `Already checked in, ${firstName}` })).toBeVisible();
    await expect(page.getByText(/You have already checked in today at \d{1,2}:\d{2} [ap]m\. You can’t check in again today\./)).toBeVisible();
    await page.getByRole("heading", { name: `Already checked in, ${firstName}` }).click();

    // Leaving needs the staff password.
    await page.getByRole("button", { name: "Exit", exact: true }).click();
    await page.getByLabel("Password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Exit", exact: true }).click();
    await expect(page.getByText("That password is not right.")).toBeVisible();
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Exit", exact: true }).click();
    await expect(page).toHaveURL(/\/attendance$/);

    // The visit is in today's log exactly once.
    const log = page.getByRole("table").filter({ has: page.getByRole("columnheader", { name: "Time" }) });
    await expect(log.getByRole("link", { name: new RegExp(`${firstName} Visitor`) })).toHaveCount(1);

    // Staff cannot record a second visit for today either.
    await page.getByRole("button", { name: "Record a visit" }).click();
    const picker = page.getByLabel("Member", { exact: true });
    await picker.selectOption({ label: (await picker.locator("option").filter({ hasText: firstName }).innerText()).trim() });
    await page.getByRole("button", { name: "Mark present" }).click();
    await expect(page.getByText(new RegExp(`${firstName} has already checked in today at .+\\. Only one visit a day can be recorded\\.`))).toBeVisible();
    await page.keyboard.press("Escape");

    // The member profile shows the visit, and the package one visit down.
    await page.goto(memberUrl);
    await expect(page.getByText("Last visit today at")).toBeVisible();
    await expect(page.getByText("89 visits left · 1 of 90 used")).toBeVisible();
    await expect(page.getByText("1 of 90 visits used · 89 visits left")).toBeVisible();

    // Removing the check-in gives the visit back.
    await page.goto("/attendance");
    await log.getByRole("row").filter({ hasText: `${firstName} Visitor` }).getByRole("button", { name: "Remove" }).click();
    await page.getByRole("button", { name: "Remove", exact: true }).last().click();
    // The page behind the confirmation is hidden while it is open, so wait for it to close first.
    await expect(page.getByRole("button", { name: "Record a visit" })).toBeVisible();
    await expect(log.getByRole("link", { name: new RegExp(`${firstName} Visitor`) })).toHaveCount(0);
    await page.goto(memberUrl);
    await expect(page.getByText("90 visits left · 0 of 90 used")).toBeVisible();

    // Clean up: deleting the member removes the attendance with it.
    await deleteMember(page, memberUrl);
    await deletePlan(page, planName);
  });

  test("the kiosk finds members by name, mobile and member number, and tells two people with the same name apart", async ({ page }) => {
    await signIn(page);

    const stamp = Date.now().toString().slice(-6);
    const firstName = `Twin${stamp}`;
    const planName = `Twin plan ${stamp}`;
    const mobile = `9${stamp}123`;
    await createPlan(page, planName);
    const one = await createMember(page, { firstName, lastName: "Same", mobile: `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`, planName });
    const two = await createMember(page, { firstName, lastName: "Same", mobile: `7${stamp}456`, planName });

    await openKiosk(page);
    const search = page.getByLabel(SEARCH);
    const tiles = page.getByRole("button", { name: `${firstName} Same` });

    // By name both show, each with the last digits of their own mobile.
    await search.fill(firstName);
    await expect(tiles).toHaveCount(2);
    await expect(tiles.filter({ hasText: `••${mobile.slice(-4)}` })).toHaveCount(1);
    await expect(tiles.filter({ hasText: `••${stamp.slice(-1)}456` })).toHaveCount(1);

    // The full mobile finds just the one, however it is typed.
    for (const typed of [mobile, `+91 ${mobile}`, `0${mobile}`, `${mobile.slice(0, 5)}-${mobile.slice(5)}`, mobile.slice(0, 6)]) {
      await search.fill(typed);
      await expect(tiles).toHaveCount(1);
      await expect(tiles).toContainText(`••${mobile.slice(-4)}`);
    }

    // So does the member number, with or without the hash.
    const serial = /#(\d+)/.exec((await tiles.innerText()) ?? "")?.[1];
    expect(serial).toBeTruthy();
    for (const typed of [`${serial}`, `#${serial}`]) {
      await search.fill(typed);
      await expect(page.getByRole("list", { name: "Members" }).getByRole("button").first()).toContainText(`#${serial}`);
    }

    // The confirmation step shows which of the two this is.
    await search.fill(mobile);
    await tiles.click();
    await expect(page.getByRole("dialog")).toContainText(`mobile ending ${mobile.slice(-4)}`);
    await page.getByRole("button", { name: "Not me" }).click();

    // A number nobody has says so, once the lookup is back.
    await search.fill("0000000001");
    await expect(page.getByText("No one found for “0000000001”")).toBeVisible();

    await exitKiosk(page);
    await deleteMember(page, one);
    await deleteMember(page, two);
    await deletePlan(page, planName);
  });

  test("a package is over when its visits are used, and its last visit says so", async ({ page }) => {
    await signIn(page);

    const stamp = Date.now().toString().slice(-6);
    const firstName = `Last${stamp}`;
    const planName = `One visit ${stamp}`;
    await createPlan(page, planName, 1);
    const memberUrl = await createMember(page, { firstName, lastName: "Visit", mobile: `4${stamp}4321`, planName, visits: 1 });

    await openKiosk(page);
    const search = page.getByLabel(SEARCH);
    await search.fill(firstName);
    await page.getByRole("button", { name: `${firstName} Visit` }).click();
    await expect(page.getByRole("dialog").getByText(/1 visit left/)).toBeVisible();
    await page.getByRole("button", { name: "Yes, check me in" }).click();
    await expect(page.getByRole("heading", { name: `Welcome, ${firstName}!` })).toBeVisible();
    await expect(page.getByText("No visits left", { exact: true })).toBeVisible();
    await expect(page.getByText("That was the last visit on your package. Please renew at the front desk.")).toBeVisible();
    await page.getByRole("heading", { name: `Welcome, ${firstName}!` }).click();

    // Still on the list today, so a second try is told they are checked in rather than left searching.
    await search.fill(firstName);
    await page.getByRole("button", { name: `${firstName} Visit` }).click();
    await page.getByRole("button", { name: "Yes, check me in" }).click();
    await expect(page.getByRole("heading", { name: `Already checked in, ${firstName}` })).toBeVisible();
    await page.getByRole("heading", { name: `Already checked in, ${firstName}` }).click();

    // The package is used up, and staff can no longer pick the member.
    await exitKiosk(page);
    await page.getByRole("button", { name: "Record a visit" }).click();
    await expect(page.getByLabel("Member", { exact: true }).locator("option").filter({ hasText: firstName })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await page.goto(memberUrl);
    await expect(page.getByText("Used up").first()).toBeVisible();
    await expect(page.getByText("All 1 visits used")).toBeVisible();

    await deleteMember(page, memberUrl);
    await deletePlan(page, planName);
  });

  test("only members with an active package can have attendance recorded", async ({ page, browser }) => {
    await signIn(page);

    const stamp = Date.now().toString().slice(-6);
    const planName = `Gate plan ${stamp}`;
    const active = `Active${stamp}`;
    const lapsed = `Lapsed${stamp}`;
    const none = `Nopack${stamp}`;
    const noneMobile = `6${stamp}789`;
    await createPlan(page, planName);
    const activeUrl = await createMember(page, { firstName: active, lastName: "Member", mobile: `5${stamp}111`, planName });
    const lapsedUrl = await createMember(page, { firstName: lapsed, lastName: "Member", mobile: `5${stamp}222`, planName });
    const noneUrl = await createMember(page, { firstName: none, lastName: "Member", mobile: noneMobile });

    // No package: not on the kiosk by name or by mobile.
    await openKiosk(page);
    const search = page.getByLabel(SEARCH);
    await search.fill(none);
    await expect(page.getByText(`No one found for “${none}”`)).toBeVisible();
    await search.fill(noneMobile);
    await expect(page.getByText(`No one found for “${noneMobile}”`)).toBeVisible();

    // A package cancelled (from another device: this one is locked) while the
    // kiosk is open is still refused at the tap.
    await search.fill(lapsed);
    await page.getByRole("button", { name: `${lapsed} Member` }).click();
    const staff = await signInElsewhere(browser);
    await staff.goto(lapsedUrl);
    await staff.getByRole("button", { name: "Cancel", exact: true }).click();
    await staff.getByRole("button", { name: "Cancel package" }).click();
    await expect(staff.getByRole("button", { name: "Reopen" })).toBeVisible();
    await staff.context().close();
    await page.getByRole("button", { name: "Yes, check me in" }).click();
    await expect(page.getByRole("heading", { name: `No active package, ${lapsed}` })).toBeVisible();
    await page.getByRole("heading", { name: `No active package, ${lapsed}` }).click();
    await search.fill(lapsed);
    await expect(page.getByText(`No one found for “${lapsed}”`)).toBeVisible();

    // Staff can only pick members on a package.
    await exitKiosk(page);
    await page.getByRole("button", { name: "Record a visit" }).click();
    const picker = page.getByLabel("Member", { exact: true });
    await expect(picker.locator("option").filter({ hasText: active })).toHaveCount(1);
    await expect(picker.locator("option").filter({ hasText: lapsed })).toHaveCount(0);
    await expect(picker.locator("option").filter({ hasText: none })).toHaveCount(0);

    // And not for a day before the package started.
    await picker.selectOption({ label: (await picker.locator("option").filter({ hasText: active }).innerText()).trim() });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await page.getByLabel("Day", { exact: true }).fill(toDay(yesterday));
    await page.getByLabel("Time", { exact: true }).fill("09:00");
    await page.getByRole("button", { name: "Mark present" }).click();
    await expect(page.getByText(`${active} has no package with visits left on that day.`)).toBeVisible();

    await deleteMember(page, activeUrl);
    await deleteMember(page, lapsedUrl);
    await deleteMember(page, noneUrl);
    await deletePlan(page, planName);
  });
});

test.describe("packages are counted in visits", () => {
  const pkg = (over: Partial<{ status: "active" | "completed" | "cancelled"; startDate: string; visits: number; extraVisits: number; visitsUsed: number; createdAt: Date }> = {}) => ({
    status: "active" as const,
    startDate: "2026-01-01",
    visits: 30,
    extraVisits: 0,
    visitsUsed: 0,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    ...over,
  });

  test("a package has no end date: skipped days cost nothing", () => {
    // Started most of a year ago, came ten times: twenty visits are still there.
    const old = pkg({ visitsUsed: 10 });
    expect(visitsLeft(old)).toBe(20);
    expect(isUsable(old, "2026-11-25")).toBe(true);
    expect(packageState(old, LOW_VISITS_THRESHOLD, "2026-11-25")).toBe("active");
  });

  test("the state follows the visits left", () => {
    expect(packageState(pkg({ visitsUsed: 25 }), 5, "2026-11-25")).toBe("low");
    expect(packageState(pkg({ visitsUsed: 30 }), 5, "2026-11-25")).toBe("used_up");
    expect(packageState(pkg({ extraVisits: 5, visitsUsed: 30 }), 5, "2026-11-25")).toBe("low");
    expect(packageState(pkg({ startDate: "2026-12-01" }), 5, "2026-11-25")).toBe("upcoming");
    expect(packageState(pkg({ status: "cancelled", visitsUsed: 3 }), 5, "2026-11-25")).toBe("cancelled");
    expect(isUsable(pkg({ startDate: "2026-12-01" }), "2026-11-25")).toBe(false);
    expect(isUsable(pkg({ status: "completed" }), "2026-11-25")).toBe(false);
  });

  test("visits come off the oldest package first, so a renewal waits its turn", () => {
    const first = pkg({ startDate: "2026-10-01", visitsUsed: 28 });
    const renewal = pkg({ startDate: "2026-11-20", createdAt: new Date("2026-11-20T00:00:00Z") });
    expect(pickCurrentPackage([renewal, first], "2026-11-25")).toBe(first);
    expect(pickCurrentPackage([renewal, { ...first, visitsUsed: 30 }], "2026-11-25")).toBe(renewal);
  });
});
