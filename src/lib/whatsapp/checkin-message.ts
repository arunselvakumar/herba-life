import { BRANCH_TIME_ZONE } from "@/lib/attendance/constants";

/** Sends through the branch's MSG91 account, using the `checkin` template approved by Meta. */
export const MSG91_SEND_URL = "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";
const SENDER_NUMBER = "918072738519";
const TEMPLATE_NAME = "checkin";
const TEMPLATE_NAMESPACE = "c02deaa7_adfd_4b93_a986_d98520b9b5f6";
const INDIA_CODE = "91";

export type CheckInMessage = {
  firstName: string;
  at: Date;
  packageName: string;
  daysLeft: number;
};

// Set explicitly because the server's own clock is not the branch's in production.
const timeFormat = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: BRANCH_TIME_ZONE });

/**
 * The number in the form WhatsApp expects: country code and digits, no plus.
 * Stored mobiles are free text, so a bare ten-digit number is taken as Indian
 * and anything that cannot be a real number gives null.
 */
export function toWhatsAppNumber(mobile: string | null): string | null {
  const text = mobile?.trim() ?? "";
  const digits = text.replace(/\D/g, "");
  if (text.startsWith("+")) return digits.length >= 8 && digits.length <= 15 ? digits : null;
  if (digits.length === 10) return `${INDIA_CODE}${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `${INDIA_CODE}${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith(INDIA_CODE)) return digits;
  return null;
}

/** The MSG91 request. `body_1` to `body_4` fill `{{1}}` to `{{4}}` in the template. */
export function checkInRequestBody(to: string, message: CheckInMessage) {
  const values = [message.firstName, timeFormat.format(message.at).toLowerCase(), message.packageName, String(message.daysLeft)];
  return {
    integrated_number: SENDER_NUMBER,
    content_type: "template",
    payload: {
      messaging_product: "whatsapp",
      type: "template",
      template: {
        name: TEMPLATE_NAME,
        language: { code: "en", policy: "deterministic" },
        namespace: TEMPLATE_NAMESPACE,
        to_and_components: [
          {
            to: [to],
            components: Object.fromEntries(values.map((value, index) => [`body_${index + 1}`, { type: "text", value }])),
          },
        ],
      },
    },
  };
}
