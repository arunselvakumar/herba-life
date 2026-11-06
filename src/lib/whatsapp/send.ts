import "server-only";

import { MSG91_SEND_URL, checkInRequestBody, toWhatsAppNumber, type CheckInMessage } from "./checkin-message";

const SEND_TIMEOUT_MS = 10_000;

/**
 * Tell a member on WhatsApp that their check-in was recorded. A failed message
 * must never undo or block a check-in, so problems are logged, not thrown.
 * Without `MSG91_AUTH_KEY` nothing is sent, which keeps local runs and tests
 * from messaging anyone.
 */
export async function sendCheckInMessage({ memberId, mobile, ...message }: CheckInMessage & { memberId: string; mobile: string | null }): Promise<void> {
  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) return;

  const to = toWhatsAppNumber(mobile);
  if (!to) {
    console.warn(`Check-in WhatsApp skipped for member ${memberId}: no usable mobile number.`);
    return;
  }

  try {
    const response = await fetch(MSG91_SEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", authkey: authKey },
      body: JSON.stringify(checkInRequestBody(to, message)),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    // MSG91 can report a failure in the body of a 200, so both are checked.
    const result = (await response.json().catch(() => null)) as { hasError?: boolean; errors?: unknown } | null;
    if (!response.ok || result?.hasError) {
      console.error(`Check-in WhatsApp failed for member ${memberId}: HTTP ${response.status}`, result?.errors);
    }
  } catch (error) {
    console.error(`Check-in WhatsApp failed for member ${memberId}:`, error);
  }
}
