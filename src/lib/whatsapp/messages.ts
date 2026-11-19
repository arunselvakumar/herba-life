import { BRANCH_TIME_ZONE } from "@/lib/attendance/constants";
import { formatDay } from "@/lib/members/dates";

/**
 * The WhatsApp messages the branch sends, through its MSG91 account. Each one
 * is a template approved by Meta: the wording lives with Meta, and this file
 * only names the template and supplies the values for `{{1}}`, `{{2}}`, … in
 * order. The wording and the values are listed in `docs/whatsapp-messages.md`;
 * a template changed there must be changed here too, and the other way round.
 */
export const MSG91_SEND_URL = "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";
const SENDER_NUMBER = "918072738519";
const TEMPLATE_NAMESPACE = "c02deaa7_adfd_4b93_a986_d98520b9b5f6";
const INDIA_CODE = "91";

export type WhatsAppMessage = {
  /** The template's name in MSG91. */
  template: string;
  /** Values for `{{1}}`, `{{2}}`, … in order. */
  values: string[];
};

// Set explicitly because the server's own clock is not the branch's in production.
const timeFormat = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: BRANCH_TIME_ZONE });

/** Sent for each recorded visit. */
export function checkInMessage(visit: { firstName: string; at: Date; packageName: string; daysLeft: number }): WhatsAppMessage {
  return {
    template: "checkin",
    values: [visit.firstName, timeFormat.format(visit.at).toLowerCase(), visit.packageName, String(visit.daysLeft)],
  };
}

/** Sent once, when a member is enrolled. */
export function welcomeMessage(member: { firstName: string; serialNo: number; joinedOn: string }): WhatsAppMessage {
  return {
    template: "welcome",
    values: [member.firstName, String(member.serialNo), formatDay(member.joinedOn)],
  };
}

/** Sent when a package is added to a member who is already enrolled: a renewal, or a first package taken later. */
export function packageConfirmationMessage(pkg: {
  firstName: string;
  packageName: string;
  startDate: string;
  endDate: string;
}): WhatsAppMessage {
  return {
    template: "package_confirmation",
    values: [pkg.firstName, pkg.packageName, formatDay(pkg.startDate), formatDay(pkg.endDate)],
  };
}

/** Sent once per package, a few days before its last day. */
export function packageExpiryMessage(pkg: { firstName: string; packageName: string; endDate: string }): WhatsAppMessage {
  return {
    template: "package_expiry_reminder",
    values: [pkg.firstName, pkg.packageName, formatDay(pkg.endDate)],
  };
}

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

/** The MSG91 request. `body_1`, `body_2`, … fill `{{1}}`, `{{2}}`, … in the template. */
export function templateRequestBody(to: string, message: WhatsAppMessage) {
  return {
    integrated_number: SENDER_NUMBER,
    content_type: "template",
    payload: {
      messaging_product: "whatsapp",
      type: "template",
      template: {
        name: message.template,
        language: { code: "en", policy: "deterministic" },
        namespace: TEMPLATE_NAMESPACE,
        to_and_components: [
          {
            to: [to],
            components: Object.fromEntries(message.values.map((value, index) => [`body_${index + 1}`, { type: "text", value }])),
          },
        ],
      },
    },
  };
}
