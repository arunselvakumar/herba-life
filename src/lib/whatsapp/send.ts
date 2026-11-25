import "server-only";

import { MSG91_SEND_URL, templateRequestBody, toWhatsAppNumber, type WhatsAppMessage } from "./messages";

const SEND_TIMEOUT_MS = 10_000;

/**
 * - `sent`: MSG91 accepted the message. Delivery can still fail afterwards, which only MSG91's logs show.
 * - `off`: no `MSG91_AUTH_KEY`, so nothing is sent from this environment.
 * - `no_number`: the member has no mobile a message could reach.
 * - `failed`: MSG91 refused it or could not be reached; trying again may work.
 */
export type SendResult = "sent" | "off" | "no_number" | "failed";

/**
 * Send a member one of the approved WhatsApp templates. A message is never
 * worth failing the work that triggered it, so problems are logged and
 * reported back, not thrown. Without `MSG91_AUTH_KEY` nothing is sent, which
 * keeps local runs and tests from messaging anyone.
 */
export async function sendWhatsApp({
  memberId,
  mobile,
  message,
}: {
  memberId: string;
  mobile: string | null;
  message: WhatsAppMessage;
}): Promise<SendResult> {
  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) return "off";

  const what = `WhatsApp "${message.template}"`;
  const to = toWhatsAppNumber(mobile);
  if (!to) {
    console.warn(`${what} skipped for member ${memberId}: no usable mobile number.`);
    return "no_number";
  }

  try {
    const response = await fetch(MSG91_SEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", authkey: authKey },
      body: JSON.stringify(templateRequestBody(to, message)),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    // MSG91 can report a failure in the body of a 200, so both are checked.
    const result = (await response.json().catch(() => null)) as { hasError?: boolean; errors?: unknown } | null;
    if (!response.ok || result?.hasError) {
      console.error(`${what} failed for member ${memberId}: HTTP ${response.status}`, result?.errors);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error(`${what} failed for member ${memberId}:`, error);
    return "failed";
  }
}
