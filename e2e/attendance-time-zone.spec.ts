import { expect, test, type Page } from "@playwright/test";
import { combineDayAndTime, formatShortDay, formatTime, formatWeekday, periodFor, weekdayIndex } from "../src/lib/attendance/time";
import { addDays, branchAsUtc, daysBetween, toDay } from "../src/lib/members/dates";

/**
 * Attendance must read the branch's clock whatever zone the server runs in.
 * The browser tests only prove something with the server off India time, so
 * set `TZ` on the whole command for the dev server to inherit, on a free port:
 * Playwright reuses a server it finds running, which keeps its own zone.
 *
 *   TZ=UTC PORT=3101 BETTER_AUTH_URL=http://localhost:3101 NEXT_PUBLIC_APP_URL=http://localhost:3101 \
 *     bunx playwright test e2e/attendance-time-zone.spec.ts --workers=1
 *
 * Expected values are worked out here from the literal zone, not from the app.
 */
const INDIA = "Asia/Kolkata";

const ADMIN = {
  email: "admin@herbalife.local",
  password: "Herbalife2026!",
} as const;

function india(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: INDIA,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = Number(part("hour"));
  return {
    day: `${part("year")}-${part("month")}-${part("day")}`,
    hour,
    weekday: part("weekday"),
    time: new Intl.DateTimeFormat("en-IN", { timeZone: INDIA, hour: "numeric", minute: "2-digit" }).format(date).toLowerCase(),
    period: hour < 12 ? "Morning" : hour < 16 ? "Afternoon" : "Evening",
  };
}

function shiftDay(day: string, by: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + by * 86_400_000).toISOString().slice(0, 10);
}

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function createPlan(page: Page, name: string) {
  await page.goto("/packages/new");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Duration").fill("90");
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

/** A member a week into `planName`, so they can be marked present today and yesterday. */
async function createMember(page: Page, firstName: string, mobile: string, planName: string): Promise<string> {
  await page.goto("/members/new");
  await page.getByLabel("First name").fill(firstName);
  await page.getByLabel("Last name").fill("Zone");
  await page.getByLabel("Joined on").fill(shiftDay(india().day, -7));
  await page.getByLabel("Mobile").fill(mobile);
  await page.getByText("Start a package now").click();
  await page.getByLabel("Package", { exact: true }).selectOption({ label: `${planName} · 90 days · ₹12,000` });
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

/** The member's line in the day's log, which is not the only table they can appear in. */
function logRow(page: Page, firstName: string) {
  const log = page.getByRole("table").filter({ has: page.getByRole("columnheader", { name: "Time" }) });
  return log.getByRole("row").filter({ hasText: firstName });
}

/** A chart's bars as `label → check-ins`, read from the hover titles. */
async function chartCounts(page: Page, ariaLabel: string): Promise<Map<string, number>> {
  const titles = await page.locator(`svg[aria-label="${ariaLabel}"] title`).allTextContents();
  return new Map(
    titles.map((title) => {
      const [, label = title, value = "0"] = title.match(/^(.+?)(?:–.+)?: (\d+) check-in/) ?? [];
      return [label, Number(value)];
    }),
  );
}

/** Bars that grew between two readings of a chart. */
function grew(before: Map<string, number>, after: Map<string, number>): string[] {
  return [...after].filter(([label, value]) => value > (before.get(label) ?? 0)).map(([label]) => label);
}

test.describe("the branch's clock, as pure functions", () => {
  test("the day turns over at midnight in India, not at the server's", () => {
    expect(toDay(new Date("2026-11-06T18:29:59Z"))).toBe("2026-11-06");
    expect(toDay(new Date("2026-11-06T18:30:00Z"))).toBe("2026-11-07");
    expect(toDay(new Date("2026-12-31T19:00:00Z"))).toBe("2027-01-01");
  });

  test("the period turns over at India's noon and 4 pm", () => {
    expect(periodFor(new Date("2026-11-05T18:30:00Z"))).toBe("morning");
    expect(periodFor(new Date("2026-11-06T06:29:00Z"))).toBe("morning");
    expect(periodFor(new Date("2026-11-06T06:30:00Z"))).toBe("afternoon");
    expect(periodFor(new Date("2026-11-06T10:29:00Z"))).toBe("afternoon");
    expect(periodFor(new Date("2026-11-06T10:30:00Z"))).toBe("evening");
  });

  test("times are shown in India, including just after midnight", () => {
    expect(formatTime(new Date("2026-11-06T03:44:00Z"))).toBe("9:14 am");
    expect(formatTime(new Date("2026-11-05T18:35:00Z"))).toBe("12:05 am");
  });

  test("a time typed by staff is read as India time", () => {
    expect(combineDayAndTime("2026-11-06", "09:14").toISOString()).toBe("2026-11-06T03:44:00.000Z");
    expect(combineDayAndTime("2026-11-06", "00:10").toISOString()).toBe("2026-11-05T18:40:00.000Z");
    expect(toDay(combineDayAndTime("2026-11-06", "00:10"))).toBe("2026-11-06");
    expect(toDay(combineDayAndTime("2026-11-06", "23:59"))).toBe("2026-11-06");
  });

  test("the weekday chart counts Sunday evening UTC as India's Monday", () => {
    expect(weekdayIndex(new Date("2026-11-08T12:00:00Z"))).toBe(6);
    expect(weekdayIndex(new Date("2026-11-08T19:00:00Z"))).toBe(0);
  });

  test("exports carry India's wall clock", () => {
    expect(branchAsUtc(new Date("2026-11-06T03:44:10Z")).toISOString()).toBe("2026-11-06T09:14:10.000Z");
  });

  test("calendar days never drift, whichever side of India this runs on", () => {
    expect(addDays("2026-11-06", -1)).toBe("2026-11-05");
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    // Daylight saving changes in the US and in Australia.
    expect(addDays("2026-10-31", 2)).toBe("2026-11-02");
    expect(addDays("2026-10-03", 2)).toBe("2026-10-05");
    expect(daysBetween("2026-10-31", "2026-11-02")).toBe(2);
    expect(formatWeekday("2026-11-06")).toBe("Friday");
    expect(formatShortDay("2026-11-06")).toBe("6 Nov");
  });
});

test.describe("on the tablet in India", () => {
  test.use({ timezoneId: INDIA });

  test("a kiosk check-in lands on the right time, day, period and charts", async ({ page }) => {
    await signIn(page);
    const stamp = Date.now().toString().slice(-6);
    const firstName = `Zone${stamp}`;
    const planName = `Zone plan ${stamp}`;
    await createPlan(page, planName);
    const memberUrl = await createMember(page, firstName, `7${stamp}4321`, planName);

    await page.goto("/attendance");
    const hoursBefore = await chartCounts(page, "Bar chart of check-ins by hour of day");
    const weekdaysBefore = await chartCounts(page, "Bar chart of check-ins by weekday");

    await page.goto("/attendance/kiosk");
    await page.getByLabel("Search by name, mobile or member number").fill(firstName);
    await page.getByRole("button", { name: `${firstName} Zone` }).click();
    const before = india();
    await page.getByRole("button", { name: "Yes, check me in" }).click();
    await expect(page.getByRole("heading", { name: `Welcome, ${firstName}!` })).toBeVisible();
    const after = india();
    const times = [before.time, after.time];

    // The welcome tile, not the header clock, which the browser works out itself.
    const tile = await page.getByText("Checked in", { exact: true }).locator("..").innerText();
    expect(times).toContain(tile.split("\n")[0]?.toLowerCase());

    await page.goto("/attendance");
    await expect(page.getByRole("button", { name: /Pick a day/ })).toHaveAccessibleName(new RegExp(new Intl.DateTimeFormat("en-IN", { timeZone: INDIA, day: "numeric", month: "long", year: "numeric" }).format(new Date())));
    const row = logRow(page, firstName);
    await expect(row).toHaveCount(1);
    expect(times).toContain((await row.getByRole("cell").first().innerText()).trim());
    await expect(row).toContainText(after.period);

    const hourLabel = `${after.hour % 12 || 12}${after.hour < 12 ? "am" : "pm"}`;
    const hours = grew(hoursBefore, await chartCounts(page, "Bar chart of check-ins by hour of day"));
    expect(hours.map((label) => label.toLowerCase().replace(/\s/g, ""))).toEqual([hourLabel]);
    expect(grew(weekdaysBefore, await chartCounts(page, "Bar chart of check-ins by weekday"))).toEqual([after.weekday]);

    await deleteMember(page, memberUrl);
    await deletePlan(page, planName);
  });

  test("staff can record a visit for just now, and for 9:14 am yesterday", async ({ page }) => {
    await signIn(page);
    const stamp = Date.now().toString().slice(-6);
    const firstName = `Staff${stamp}`;
    const planName = `Staff plan ${stamp}`;
    await createPlan(page, planName);
    const memberUrl = await createMember(page, firstName, `6${stamp}4321`, planName);

    // Off India time this was "in the future": 8 pm read as UTC is 1:30 am tomorrow.
    await page.goto("/attendance");
    await page.getByRole("button", { name: "Record a visit" }).click();
    await page.getByLabel("Member", { exact: true }).selectOption({ label: await page.getByLabel("Member", { exact: true }).locator("option", { hasText: firstName }).innerText() });
    const now = india();
    await page.getByRole("button", { name: "Mark present" }).click();
    await expect(page.getByText(`${firstName} marked present at`)).toBeVisible();
    await expect(page.getByText("That time is in the future.")).toHaveCount(0);

    const yesterday = shiftDay(now.day, -1);
    await page.goto(`/attendance?day=${yesterday}`);
    await page.getByRole("button", { name: "Record a visit" }).click();
    await page.getByLabel("Member", { exact: true }).selectOption({ label: await page.getByLabel("Member", { exact: true }).locator("option", { hasText: firstName }).innerText() });
    await page.getByLabel("Time", { exact: true }).fill("09:14");
    await page.getByRole("button", { name: "Mark present" }).click();
    await expect(page.getByText(`${firstName} marked present at 9:14 am.`)).toBeVisible();

    await page.goto(`/attendance?day=${yesterday}`);
    const row = logRow(page, firstName);
    await expect(row).toContainText("9:14 am");
    await expect(row).toContainText("Morning");

    await deleteMember(page, memberUrl);
    await deletePlan(page, planName);
  });
});

test.describe("on a browser east of India", () => {
  test.use({ timezoneId: "Australia/Sydney" });

  test("stepping and picking days stays on the day that was chosen", async ({ page }) => {
    const problems: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" && /hydrat/i.test(message.text())) problems.push(message.text());
    });

    await signIn(page);
    const today = india().day;
    const yesterday = shiftDay(today, -1);
    const twoDaysAgo = shiftDay(today, -2);

    await page.goto("/attendance");
    await page.getByRole("button", { name: "Previous day" }).click();
    await expect(page).toHaveURL(new RegExp(`day=${yesterday}`));
    await page.getByRole("button", { name: "Previous day" }).click();
    await expect(page).toHaveURL(new RegExp(`day=${twoDaysAgo}`));

    // Picking yesterday in the calendar: the picker hands back the browser's midnight.
    const [year, month, date] = yesterday.split("-").map(Number);
    await page.getByRole("button", { name: /Pick a day/ }).click();
    await page.locator(`button[data-day="${new Date(year ?? 1970, (month ?? 1) - 1, date ?? 1).toLocaleDateString()}"]`).click();
    await expect(page).toHaveURL(new RegExp(`day=${yesterday}`));

    expect(problems).toEqual([]);
  });
});
