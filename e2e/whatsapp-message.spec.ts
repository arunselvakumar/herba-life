import { expect, test } from "@playwright/test";
import {
  checkInMessage,
  packageConfirmationMessage,
  packageLowVisitsMessage,
  templateRequestBody,
  toWhatsAppNumber,
  welcomeMessage,
} from "../src/lib/whatsapp/messages";

test.describe("WhatsApp messages", () => {
  test("mobiles are turned into WhatsApp numbers", () => {
    expect(toWhatsAppNumber("9876543210")).toBe("919876543210");
    expect(toWhatsAppNumber("98765 43210")).toBe("919876543210");
    expect(toWhatsAppNumber("09876543210")).toBe("919876543210");
    expect(toWhatsAppNumber("919876543210")).toBe("919876543210");
    expect(toWhatsAppNumber("+91 98765-43210")).toBe("919876543210");
    expect(toWhatsAppNumber("+971 50 123 4567")).toBe("971501234567");
  });

  test("numbers that cannot be real are refused", () => {
    expect(toWhatsAppNumber(null)).toBeNull();
    expect(toWhatsAppNumber("")).toBeNull();
    expect(toWhatsAppNumber("12345")).toBeNull();
    expect(toWhatsAppNumber("98765432101")).toBeNull();
  });

  test("the request fills the template in order, with the time in India", () => {
    // 03:44 UTC is 9:14 am in India, whatever the server's own clock says.
    const body = templateRequestBody(
      "919876543210",
      checkInMessage({ firstName: "Priya", at: new Date("2026-11-06T03:44:00Z"), packageName: "Gold", visitsLeft: 0 }),
    );

    const { name, language, to_and_components: recipients } = body.payload.template;
    expect(name).toBe("checkin");
    expect(language).toEqual({ code: "en", policy: "deterministic" });
    expect(recipients).toEqual([
      {
        to: ["919876543210"],
        components: {
          body_1: { type: "text", value: "Priya" },
          body_2: { type: "text", value: "9:14 am" },
          body_3: { type: "text", value: "Gold" },
          body_4: { type: "text", value: "0" },
        },
      },
    ]);
  });

  // The order of the values is the order of {{1}}, {{2}}, … in the template Meta approved.
  test("a new member is welcomed with their member number and joining date", () => {
    expect(welcomeMessage({ firstName: "Priya", serialNo: 42, joinedOn: "2026-11-19" })).toEqual({
      template: "welcome",
      values: ["Priya", "42", "19 Nov 2026"],
    });
  });

  test("a package is confirmed with its name, first day and number of visits", () => {
    expect(packageConfirmationMessage({ firstName: "Priya", packageName: "3 months", startDate: "2026-11-19", visits: 90 })).toEqual({
      template: "package_confirmation_visits",
      values: ["Priya", "3 months", "19 Nov 2026", "90"],
    });
  });

  test("the reminder names the package and the visits left on it", () => {
    const message = packageLowVisitsMessage({ firstName: "Priya", packageName: "3 months", visitsLeft: 3 });
    expect(message).toEqual({ template: "package_low_visits_reminder", values: ["Priya", "3 months", "3"] });

    const { name, to_and_components: recipients } = templateRequestBody("919876543210", message).payload.template;
    expect(name).toBe("package_low_visits_reminder");
    expect(Object.keys(recipients[0]?.components ?? {})).toEqual(["body_1", "body_2", "body_3"]);
  });

  test("the reminder job refuses a call without the cron secret", async ({ request }) => {
    const response = await request.get("/api/cron/package-reminder");
    expect(response.status()).toBe(401);
  });
});
