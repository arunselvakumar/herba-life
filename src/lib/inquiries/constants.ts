/**
 * Shared vocabulary for the inquiry module. Safe to import from client
 * components: no server-only code lives here.
 */

export const INQUIRY_STATUSES = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number]["value"];

/** Statuses the branch is still working on. */
export const OPEN_STATUSES: readonly InquiryStatus[] = ["new", "in_progress"];

export function isOpenStatus(status: InquiryStatus): boolean {
  return OPEN_STATUSES.includes(status);
}

export const INQUIRY_SOURCES = [
  { value: "walk_in", label: "Walk-in" },
  { value: "phone", label: "Phone call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "referral", label: "Referral" },
  { value: "social_media", label: "Social media" },
  { value: "event", label: "Event / camp" },
  { value: "other", label: "Other" },
] as const;
export type InquirySource = (typeof INQUIRY_SOURCES)[number]["value"];

/** What the person said they want out of the programme. */
export const GOALS = [
  { value: "weight_loss", label: "Weight loss" },
  { value: "weight_gain", label: "Weight gain" },
  { value: "general_wellness", label: "General wellness" },
  { value: "energy", label: "Energy / stamina" },
  { value: "sports_nutrition", label: "Sports nutrition" },
  { value: "skin_hair", label: "Skin & hair" },
  { value: "digestion", label: "Digestion" },
  { value: "other", label: "Other" },
] as const;
export type Goal = (typeof GOALS)[number]["value"];

export const ACTIVITY_TYPES = [
  { value: "call", label: "Phone call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "visit", label: "Visit" },
  { value: "note", label: "Note" },
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number]["value"];

/** Activity types the staff can log; "status" entries are written by the system. */
export const ACTIVITY_LABELS: Record<ActivityType | "status", string> = {
  call: "Phone call",
  whatsapp: "WhatsApp",
  visit: "Visit",
  note: "Note",
  status: "Status",
};

/** Logging one of these moves a "new" inquiry to "in progress". */
export const CONTACT_ACTIVITY_TYPES: readonly ActivityType[] = ["call", "whatsapp", "visit"];
