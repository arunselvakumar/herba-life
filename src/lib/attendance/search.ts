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

/**
 * Find members for the kiosk search box. Matches on the start of the first or
 * last name first, then anywhere in the full name, then on the member number
 * or the last digits of the mobile. Results are ranked so the best match is
 * the first tile.
 */
export function matchMembers(members: readonly KioskMember[], query: string, limit = 24): KioskMember[] {
  const q = normalise(query);
  if (!q) return members.slice(0, limit);

  const digits = q.replace(/\D/g, "");
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
    else if (digits && /^\d+$/.test(q)) {
      if (String(m.serialNo) === digits) score = 5;
      else if (m.mobileHint && m.mobileHint.endsWith(digits)) score = 1;
    }
    if (score > 0) scored.push({ member: m, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.member.firstName.localeCompare(b.member.firstName))
    .slice(0, limit)
    .map((s) => s.member);
}
