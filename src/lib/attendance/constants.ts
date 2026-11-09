/**
 * Shared vocabulary for the attendance module. Safe to import from client
 * components: no server-only code lives here.
 */

export const PERIODS = [
  { value: "morning", label: "Morning", short: "AM" },
  { value: "afternoon", label: "Afternoon", short: "Noon" },
  { value: "evening", label: "Evening", short: "PM" },
] as const;
export type Period = (typeof PERIODS)[number]["value"];

/** Where the branch is, for anything that must show its local time whatever the server's clock says. */
export const BRANCH_TIME_ZONE = "Asia/Kolkata";

/** Local hour (0–23) at which the afternoon and the evening begin. */
export const AFTERNOON_STARTS_AT = 12;
export const EVENING_STARTS_AT = 16;

export const SOURCES = [
  { value: "kiosk", label: "Self check-in" },
  { value: "manual", label: "Recorded by staff" },
] as const;
export type Source = (typeof SOURCES)[number]["value"];

/**
 * A second tap within this window is treated as the same visit, so a member
 * who taps twice (or comes back for a forgotten bottle) does not get counted
 * twice. Morning and evening visits are far enough apart to both count.
 */
export const CHECKIN_COOLDOWN_MINUTES = 45;

/** Members on an active package who have not visited for this long are flagged. */
export const NOT_SEEN_AFTER_DAYS = 7;

/** How long the kiosk shows the welcome screen before returning to search. */
export const KIOSK_WELCOME_SECONDS = 6;
/** Idle time on the confirmation step before the kiosk goes back to search. */
export const KIOSK_IDLE_SECONDS = 30;
/** How often the kiosk refreshes its member list from the server. */
export const KIOSK_REFRESH_MINUTES = 10;
/** Most tiles a kiosk search shows. */
export const KIOSK_SEARCH_LIMIT = 24;
/** Digits needed before a number is also looked up as a mobile. */
export const MOBILE_SEARCH_MIN_DIGITS = 4;
/** Pause in typing before that lookup goes to the server. */
export const MOBILE_SEARCH_DEBOUNCE_MS = 250;

export const RANGES = [
  { value: "14d", label: "2 weeks", days: 14, unit: "day" },
  { value: "30d", label: "30 days", days: 30, unit: "day" },
  { value: "90d", label: "90 days", days: 90, unit: "day" },
  { value: "12m", label: "12 months", days: 365, unit: "month" },
] as const;
export type Range = (typeof RANGES)[number]["value"];
export const DEFAULT_RANGE: Range = "30d";

export const KIOSK_PATH = "/attendance/kiosk";
/** Changes on every lock so cached renders from before the lock are never reused. Not used for any security decision. */
export const KIOSK_MARKER_COOKIE = "hl_kiosk";
/** Wrong exit passwords allowed before the kiosk makes the staff member wait. */
export const KIOSK_EXIT_MAX_ATTEMPTS = 5;
export const KIOSK_EXIT_LOCKOUT_SECONDS = 60;
