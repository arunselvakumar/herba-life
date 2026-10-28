import { Badge } from "@/components/ui/badge";
import { PERIODS, type Period } from "@/lib/attendance/constants";
import { cn } from "@/lib/utils";

const TONE: Record<Period, string> = {
  morning: "bg-amber-100 text-amber-900",
  afternoon: "bg-teal-100 text-teal-900",
  evening: "bg-brand-800 text-white",
};

export function PeriodBadge({ period, className }: { period: Period; className?: string }) {
  const label = PERIODS.find((p) => p.value === period)?.label ?? period;
  return <Badge className={cn("rounded-full border-transparent font-semibold", TONE[period], className)}>{label}</Badge>;
}
