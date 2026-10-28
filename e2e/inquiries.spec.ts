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

test.describe("enquiries", () => {
  test("records an enquiry, logs a follow-up, converts it to a member, then cleans up", async ({ page }) => {
    await signIn(page);

    const stamp = Date.now().toString().slice(-6);
    const firstName = `Lead${stamp}`;
    const mobile = `8${stamp}0000`;

    // Record the inquiry with a free-check reading.
    await page.goto("/inquiries/new");
    await page.getByLabel("Source").selectOption("walk_in");
    await page.getByLabel("First name").fill(firstName);
    await page.getByLabel("Last name").fill("Prospect");
    await page.getByLabel("Gender").selectOption("female");
    await page.getByLabel("Mobile").fill(mobile);
    await page.getByLabel("Weight loss").check();
    await page.getByLabel("Goal notes").fill("Wants to lose 5 kg");
    await page.getByLabel("Height").fill("158");
    await page.getByLabel("Weight", { exact: true }).fill("68.5");
    await page.getByRole("button", { name: "Save enquiry" }).click();

    await expect(page).toHaveURL(/\/inquiries\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: `${firstName} Prospect` })).toBeVisible();
    await expect(page.getByText("New", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Wants to lose 5 kg")).toBeVisible();
    const inquiryUrl = page.url();

    // Log a call and schedule the next follow-up; the status moves to in progress.
    // The previous page stays mounted (hidden) for instant back navigation, so
    // scope to the follow-up form explicitly.
    const followUp = page.locator("form").filter({ has: page.getByRole("button", { name: "Save follow-up" }) });
    await followUp.getByLabel("What").selectOption("call");
    await followUp.getByLabel("Notes").fill("Interested, will visit on Saturday");
    await followUp.getByLabel("Next follow-up").fill("2030-01-15");
    await followUp.getByRole("button", { name: "Save follow-up" }).click();
    await expect(page.getByText("Logged. Next follow-up scheduled.")).toBeVisible();
    await expect(page.getByText("Interested, will visit on Saturday")).toBeVisible();
    await expect(page.getByText("In progress").first()).toBeVisible();
    await expect(page.getByText("15 Jan 2030").first()).toBeVisible();

    // It shows up in the open list.
    await page.goto(`/inquiries?q=${firstName}`);
    await expect(page.getByRole("link", { name: `${firstName} Prospect`, exact: true })).toBeVisible();

    // Convert: the member form arrives pre-filled from the inquiry.
    await page.goto(inquiryUrl);
    await page.getByRole("link", { name: "Convert to member" }).click();
    await expect(page).toHaveURL(/\/convert$/);
    await expect(page.getByLabel("First name")).toHaveValue(firstName);
    await expect(page.getByLabel("Mobile")).toHaveValue(mobile);
    await expect(page.getByLabel("Height")).toHaveValue("158");
    await expect(page.getByLabel("Weight", { exact: true })).toHaveValue("68.5");
    await expect(page.getByLabel("Remarks")).toHaveValue(/Wants to lose 5 kg/);
    await page.getByRole("button", { name: "Create member" }).click();

    await expect(page).toHaveURL(/\/members\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: `${firstName} Prospect` })).toBeVisible();
    await expect(page.getByText("Baseline from enquiry")).toBeVisible();
    await expect(page.getByRole("link", { name: /Enquiry #\d+/ })).toBeVisible();

    // The inquiry is now converted and links to the member.
    await page.goto(inquiryUrl);
    await expect(page.getByText("Converted to a member")).toBeVisible();
    await expect(page.getByRole("link", { name: "Convert to member" })).toHaveCount(0);
    await page.getByRole("link", { name: /Open member #\d+/ }).click();
    await expect(page).toHaveURL(/\/members\/[0-9a-f-]{36}$/);

    // Clean up: delete the member, then the inquiry.
    await page.getByRole("button", { name: "Delete" }).first().click();
    await page.getByRole("button", { name: "Delete member" }).click();
    await expect(page).toHaveURL(/\/members$/);

    await page.goto(inquiryUrl);
    await expect(page.getByText("The member record has since been deleted.")).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).first().click();
    await page.getByRole("button", { name: "Delete enquiry" }).click();
    await expect(page).toHaveURL(/\/inquiries$/);
  });

  test("requires a reason to mark an enquiry lost, then allows reopening", async ({ page }) => {
    await signIn(page);
    const stamp = Date.now().toString().slice(-6);
    const firstName = `Lost${stamp}`;

    await page.goto("/inquiries/new");
    await page.getByLabel("First name").fill(firstName);
    await page.getByRole("button", { name: "Save enquiry" }).click();
    await expect(page).toHaveURL(/\/inquiries\/[0-9a-f-]{36}$/);

    await page.getByRole("button", { name: "Mark lost" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Mark lost" }).click();
    await expect(page.getByText("Say why, briefly, so the next person knows")).toBeVisible();
    await page.getByLabel("Reason").fill("Too expensive");
    await page.getByRole("dialog").getByRole("button", { name: "Mark lost" }).click();
    await expect(page.getByText(/^Marked lost on/)).toBeVisible();
    await expect(page.getByText("Too expensive", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Reopen" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Reopen" }).click();
    await expect(page.getByText("In progress").first()).toBeVisible();

    await page.getByRole("button", { name: "Delete" }).first().click();
    await page.getByRole("button", { name: "Delete enquiry" }).click();
    await expect(page).toHaveURL(/\/inquiries$/);
  });

  test("shows a validation error instead of saving an empty enquiry", async ({ page }) => {
    await signIn(page);
    await page.goto("/inquiries/new");
    await page.getByRole("button", { name: "Save enquiry" }).click();
    await expect(page.getByText("First name is required")).toBeVisible();
    await expect(page).toHaveURL(/\/inquiries\/new$/);
  });
});
