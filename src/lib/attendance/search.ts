import { KIOSK_SEARCH_LIMIT, MOBILE_SEARCH_MIN_DIGITS } from "./constants";
import type { KioskMember } from "./queries";

/** Lower-case, accent-free, single-spaced. */
export function normalise(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** The digits of a query typed as a number ("#12", "+91 98765-43210"); empty for anything else. */
export function numberDigits(query: string): string {
  const q = query.trim();
  return /^[#+]?[\d\s().-]+$/.test(q) ? q.replace(/\D/g, "") : "";
}

/**
 * What to look up as a mobile, or empty if the query is too short. Only the
 * last ten digits are kept so a country code or leading zero still matches a
 * number saved without one.
 */
export function mobileNeedle(query: string): string {
  const digits = numberDigits(query);
  return digits.length >= MOBILE_SEARCH_MIN_DIGITS ? digits.slice(-10) : "";
}

/**
 * Find members for the kiosk search box. Matches on the start of the first or
 * last name first, then anywhere in the full name, then on the exact member
 * number, then on the mobile: the last digits, or `mobileMatches`, the ids the
 * server found for a longer number. Results are ranked so the best match is
 * the first tile.
 */
export function matchMembers(
  members: readonly KioskMember[],
  query: string,
  limit = KIOSK_SEARCH_LIMIT,
  mobileMatches?: ReadonlySet<string>,
): KioskMember[] {
  const q = normalise(query);
  if (!q) return members.slice(0, limit);

  const digits = numberDigits(q);
  const scored: { member: KioskMember; score: number }[] = [];

  for (const m of members) {
    const first = normalise(m.firstName);
    const last = normalise(m.lastName);
    const full = `${first} ${last}`.trim();
    let score = 0;
    if (first.startsWith(q) || full.startsWith(q)) score = 5;
    else if (last.startsWith(q)) score = 4;
    else if (full.split(" ").some((part) => part.startsWith(q))) score = 3;
    else if (full.includes(q)) score = 2;
    else if (digits) {
      if (String(m.serialNo) === digits) score = 5;
      else if (mobileMatches?.has(m.id) || m.mobileHint?.endsWith(digits)) score = 1;
    }
    if (score > 0) scored.push({ member: m, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.member.firstName.localeCompare(b.member.firstName))
    .slice(0, limit)
    .map((s) => s.member);
}
