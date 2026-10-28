import { Badge } from "@/components/ui/badge";
import type { InquiryStatus } from "@/lib/inquiries/constants";
import { describeFollowUp, followUpState, type FollowUpState } from "@/lib/inquiries/format";
import { formatDay } from "@/lib/members/dates";
import { cn } from "@/lib/utils";

const statusStyles: Record<InquiryStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-info/15 text-brand-800" },
  in_progress: { label: "In progress", className: "bg-brand-100 text-brand-700" },
  converted: { label: "Converted", className: "bg-brand-700 text-white" },
  lost: { label: "Lost", className: "bg-muted text-muted-foreground" },
};

export function InquiryStatusBadge({ status, className }: { status: InquiryStatus; className?: string }) {
  const style = statusStyles[status];
  return (
    <Badge className={cn("rounded-full border-transparent font-semibold", style.className, className)}>
      {style.label}
    </Badge>
  );
}

const followUpStyles: Record<FollowUpState, string> = {
  overdue: "text-destructive font-semibold",
  today: "text-amber-800 font-semibold",
  upcoming: "text-foreground",
  none: "text-muted-foreground",
};

/** "12 Nov 2026 · 3 days overdue", coloured by urgency. */
export function FollowUpDue({ nextFollowUpOn, today, className }: { nextFollowUpOn: string | null; today: string; className?: string }) {
  const state = followUpState(nextFollowUpOn, today);
  return (
    <span className={cn("text-sm", followUpStyles[state], className)}>
      {nextFollowUpOn ? (
        <>
          {formatDay(nextFollowUpOn)}
          <span className="font-normal text-muted-foreground"> · {describeFollowUp(nextFollowUpOn, today)}</span>
        </>
      ) : (
        "Not scheduled"
      )}
    </span>
  );
}
