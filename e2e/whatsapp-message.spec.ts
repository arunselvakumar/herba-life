import { expect, test } from "@playwright/test";
import {
  checkInMessage,
  packageConfirmationMessage,
  packageExpiryMessage,
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
      checkInMessage({ firstName: "Priya", at: new Date("2026-11-06T03:44:00Z"), packageName: "Gold", daysLeft: 0 }),
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

  test("a package is confirmed with its name and both dates", () => {
    expect(
      packageConfirmationMessage({ firstName: "Priya", packageName: "3 months", startDate: "2026-11-19", endDate: "2027-02-16" }),
    ).toEqual({
      template: "package_confirmation",
      values: ["Priya", "3 months", "19 Nov 2026", "16 Feb 2027"],
    });
  });

  test("the expiry reminder names the package and its last day", () => {
    const message = packageExpiryMessage({ firstName: "Priya", packageName: "3 months", endDate: "2027-02-16" });
    expect(message).toEqual({ template: "package_expiry_reminder", values: ["Priya", "3 months", "16 Feb 2027"] });

    const { name, to_and_components: recipients } = templateRequestBody("919876543210", message).payload.template;
    expect(name).toBe("package_expiry_reminder");
    expect(Object.keys(recipients[0]?.components ?? {})).toEqual(["body_1", "body_2", "body_3"]);
  });

  test("the reminder job refuses a call without the cron secret", async ({ request }) => {
    const response = await request.get("/api/cron/package-expiry");
    expect(response.status()).toBe(401);
  });
});
