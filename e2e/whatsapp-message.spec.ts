import { expect, test } from "@playwright/test";
import { checkInRequestBody, toWhatsAppNumber } from "../src/lib/whatsapp/checkin-message";

test.describe("check-in WhatsApp message", () => {
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
    const body = checkInRequestBody("919876543210", {
      firstName: "Priya",
      at: new Date("2026-11-06T03:44:00Z"),
      packageName: "Gold",
      daysLeft: 0,
    });

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
});
