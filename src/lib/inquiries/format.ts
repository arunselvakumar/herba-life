import { daysBetween } from "@/lib/members/dates";
import { INQUIRY_SOURCES, INQUIRY_STATUSES, GOALS, type InquirySource, type InquiryStatus } from "./constants";

export function statusLabel(status: InquiryStatus): string {
  return INQUIRY_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function sourceLabel(source: InquirySource): string {
  return INQUIRY_SOURCES.find((s) => s.value === source)?.label ?? source;
}

export function goalLabels(goals: readonly string[]): string[] {
  return GOALS.filter((g) => goals.includes(g.value)).map((g) => g.label);
}

export type FollowUpState = "overdue" | "today" | "upcoming" | "none";

/** How urgent the next follow-up is, for an open inquiry. */
export function followUpState(nextFollowUpOn: string | null, today: string): FollowUpState {
  if (!nextFollowUpOn) return "none";
  const diff = daysBetween(today, nextFollowUpOn);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  return "upcoming";
}

export function describeFollowUp(nextFollowUpOn: string | null, today: string): string {
  switch (followUpState(nextFollowUpOn, today)) {
    case "none":
      return "Not scheduled";
    case "today":
      return "Today";
    case "overdue": {
      const days = -daysBetween(today, nextFollowUpOn!);
      return `${days} day${days === 1 ? "" : "s"} overdue`;
    }
    case "upcoming": {
      const days = daysBetween(today, nextFollowUpOn!);
      return `In ${days} day${days === 1 ? "" : "s"}`;
    }
  }
}
