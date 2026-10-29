import { expect, test, type Browser, type Download, type Page } from "@playwright/test";
import ExcelJS from "exceljs";

const ADMIN = {
  email: "admin@herbalife.local",
  password: "Herbalife2026!",
} as const;

// Record the whole run so the export flow can be reviewed as a video.
test.use({ video: "on" });

async function signIn(page: Page, email: string = ADMIN.email, password: string = ADMIN.password) {
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

/** Click a download link and read the workbook it produced. */
async function downloadWorkbook(page: Page, trigger: () => Promise<void>): Promise<{ download: Download; workbook: ExcelJS.Workbook }> {
  const [download] = await Promise.all([page.waitForEvent("download"), trigger()]);
  const path = await download.path();
  expect(path, "download should be saved to disk").toBeTruthy();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path as string);
  return { download, workbook };
}

function sheetNames(workbook: ExcelJS.Workbook): string[] {
  return workbook.worksheets.map((s) => s.name);
}

function headers(workbook: ExcelJS.Workbook, sheet: string): string[] {
  const row = workbook.getWorksheet(sheet)?.getRow(1);
  const values: string[] = [];
  row?.eachCell((cell) => values.push(String(cell.value)));
  return values;
}

function dataRows(workbook: ExcelJS.Workbook, sheet: string): number {
  const ws = workbook.getWorksheet(sheet);
  return ws ? Math.max(0, ws.actualRowCount - 1) : 0;
}

const MODULES = [
  { path: "/members", heading: "Members", file: /^herbalife-members-\d{4}-\d{2}-\d{2}-\d{4}\.xlsx$/, sheets: ["About", "Members", "Enrolments", "Follow-ups", "Attendance"] },
  { path: "/inquiries", heading: "Enquiries", file: /^herbalife-inquiries-/, sheets: ["About", "Enquiries", "Enquiry log"] },
  { path: "/packages", heading: "Packages", file: /^herbalife-packages-/, sheets: ["About", "Packages", "Enrolments"] },
  { path: "/attendance", heading: "Attendance", file: /^herbalife-attendance-/, sheets: ["About", "Attendance", "Attendance by member"] },
  { path: "/team/users", heading: "Users", file: /^herbalife-users-/, sheets: ["About", "Users"] },
  { path: "/team/roles", heading: "Roles", file: /^herbalife-roles-/, sheets: ["About", "Roles", "Permissions"] },
] as const;

test.describe("export to Excel", () => {
  test("every module page downloads a workbook with the expected sheets", async ({ page }) => {
    await signIn(page);

    for (const mod of MODULES) {
      await page.goto(mod.path);
      await expect(page.getByRole("heading", { level: 1, name: mod.heading })).toBeVisible();
      const { download, workbook } = await downloadWorkbook(page, () => page.getByRole("link", { name: "Export" }).click());
      expect(download.suggestedFilename()).toMatch(mod.file);
      expect(sheetNames(workbook)).toEqual(mod.sheets);
      // The About sheet names who exported the file and lists each sheet.
      const about = workbook.getWorksheet("About");
      expect(about?.getCell("B4").value).toBe("Admin User");
      for (const sheet of mod.sheets.slice(1)) {
        expect(headers(workbook, sheet).length, `${sheet} should have a header row`).toBeGreaterThan(0);
      }
    }
  });

  test("the members workbook matches the list and carries the full history", async ({ page }) => {
    await signIn(page);
    await page.goto("/members");
    const countText = await page.getByText(/^\d+ members?$/).textContent();
    const expectedMembers = Number(countText?.match(/\d+/)?.[0] ?? "0");

    const { workbook } = await downloadWorkbook(page, () => page.getByRole("link", { name: "Export" }).click());
    expect(dataRows(workbook, "Members")).toBe(expectedMembers);

    const memberHeaders = headers(workbook, "Members");
    for (const header of ["Member no.", "First name", "Mobile", "Joined on", "Current package", "Last follow-up", "Visits", "Breakfast", "Blood pressure", "Member ID"]) {
      expect(memberHeaders).toContain(header);
    }
    expect(headers(workbook, "Enrolments")).toEqual(expect.arrayContaining(["Member no.", "Package", "Start date", "End date", "Amount paid", "Balance", "Status"]));
    expect(headers(workbook, "Follow-ups")).toEqual(expect.arrayContaining(["Recorded on", "Weight (kg)", "Body fat (%)", "BMI", "Waist (cm)"]));
    expect(headers(workbook, "Attendance")).toEqual(expect.arrayContaining(["Day", "Time", "Period", "Member no.", "Source"]));

    // Dates come through as real Excel dates, not text.
    const joined = workbook.getWorksheet("Members")?.getRow(2).getCell(memberHeaders.indexOf("Joined on") + 1).value;
    expect(joined).toBeInstanceOf(Date);
  });

  test("a member's profile exports just that member", async ({ page }) => {
    await signIn(page);
    await page.goto("/members");
    const first = page.getByRole("table").getByRole("link").first();
    const name = (await first.textContent())?.trim() ?? "";
    await first.click();
    await expect(page).toHaveURL(/\/members\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();

    const { download, workbook } = await downloadWorkbook(page, () => page.getByRole("link", { name: "Export" }).click());
    expect(download.suggestedFilename()).toMatch(/^herbalife-member-\d+-/);
    expect(dataRows(workbook, "Members")).toBe(1);
    const memberHeaders = headers(workbook, "Members");
    const row = workbook.getWorksheet("Members")?.getRow(2);
    const firstName = row?.getCell(memberHeaders.indexOf("First name") + 1).value;
    expect(name.startsWith(String(firstName))).toBe(true);
    // Every history sheet is limited to this member.
    const memberId = row?.getCell(memberHeaders.indexOf("Member ID") + 1).value;
    for (const sheet of ["Enrolments", "Follow-ups", "Attendance"]) {
      const ws = workbook.getWorksheet(sheet);
      const idColumn = headers(workbook, sheet).indexOf("Member ID") + 1;
      ws?.eachRow((r, index) => {
        if (index > 1) expect(r.getCell(idColumn).value).toBe(memberId);
      });
    }
  });

  test("the backup page downloads everything in one workbook", async ({ page }) => {
    await signIn(page);
    await page.getByTestId("user-menu-trigger").click();
    await page.getByRole("menuitem", { name: "Backup & export" }).click();
    await expect(page).toHaveURL(/\/export$/);
    await expect(page.getByRole("heading", { level: 1, name: "Backup & export" })).toBeVisible();
    for (const mod of MODULES) {
      await expect(page.getByRole("link", { name: `Download ${mod.heading.toLowerCase()}` })).toBeVisible();
    }

    const { download, workbook } = await downloadWorkbook(page, () => page.getByRole("link", { name: "Download everything" }).first().click());
    expect(download.suggestedFilename()).toMatch(/^herbalife-everything-/);
    expect(sheetNames(workbook)).toEqual([
      "About",
      "Members",
      "Enrolments",
      "Follow-ups",
      "Attendance",
      "Enquiries",
      "Enquiry log",
      "Packages",
      "Attendance by member",
      "Users",
      "Roles",
      "Permissions",
    ]);
    // Row counts on the page match the rows in the file.
    const chip = page.getByRole("list", { name: "Sheets in the Members workbook" }).getByRole("listitem").filter({ hasText: "Members" });
    const shown = Number((await chip.textContent())?.replace(/\D/g, "") ?? "0");
    expect(dataRows(workbook, "Members")).toBe(shown);
  });

  test("the export route needs a session and the module's export permission", async ({ page, browser, request }) => {
    // No session: sent to the login page, remembering where to come back to.
    const anonymous = await request.get("/api/export/members", { maxRedirects: 0 });
    expect(anonymous.status()).toBe(307);
    expect(anonymous.headers()["location"]).toContain("/login?next=%2Fapi%2Fexport%2Fmembers");

    await signIn(page);
    const stamp = Date.now().toString().slice(-6);
    const roleName = `E2E no-export ${stamp}`;
    const email = `e2e-export-${stamp}@herbalife.local`;
    const password = `Export${stamp}!pass`;

    // A role that can do everything in Enquiries except export.
    await page.goto("/team/roles/new");
    await page.getByLabel("Name", { exact: true }).fill(roleName);
    await page.getByTitle("Allow everything in Enquiries").click();
    await page.locator("label[for='perm-inquiries-export']").click();
    await expect(page.getByText("7 of 35 allowed")).toBeVisible();
    await page.getByRole("button", { name: "Create role" }).click();
    await expect(page).toHaveURL(/\/team\/roles$/);

    await page.goto("/team/users/new");
    await page.getByLabel("Name", { exact: true }).fill(`E2E export ${stamp}`);
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Role", { exact: true }).selectOption({ label: roleName });
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Create user" }).click();
    await expect(page).toHaveURL(/\/team\/users$/);

    const staff = await signInAs(browser, email, password);
    await staff.goto("/inquiries");
    await expect(staff.getByRole("link", { name: "New enquiry" })).toBeVisible();
    await expect(staff.getByRole("link", { name: "Export" })).toHaveCount(0);
    const forbidden = await staff.request.get("/api/export/inquiries");
    expect(forbidden.status()).toBe(403);
    await staff.getByTestId("user-menu-trigger").click();
    await expect(staff.getByRole("menuitem", { name: "Backup & export" })).toHaveCount(0);
    await staff.keyboard.press("Escape");
    await staff.goto("/export");
    await expect(staff.getByText("Nothing to export")).toBeVisible();
    await staff.context().close();

    // Clean up: delete the user, then the role.
    await page.goto("/team/users");
    const row = page.getByRole("row", { name: new RegExp(email) });
    await row.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete user" }).click();
    await expect(page.getByText(email)).toHaveCount(0);
    await page.goto("/team/roles");
    const roleRow = page.getByRole("row", { name: new RegExp(roleName) });
    await roleRow.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete" }).last().click();
    await expect(page.getByText(roleName)).toHaveCount(0);
  });
});
