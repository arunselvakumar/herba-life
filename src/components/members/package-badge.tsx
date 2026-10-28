import { Badge } from "@/components/ui/badge";
import type { PackageState } from "@/lib/members/format";
import { cn } from "@/lib/utils";

const styles: Record<PackageState, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-brand-100 text-brand-700" },
  expiring: { label: "Ending soon", className: "bg-warning/20 text-amber-800" },
  upcoming: { label: "Upcoming", className: "bg-accent-soft/60 text-foreground" },
  expired: { label: "Expired", className: "bg-destructive/10 text-destructive" },
  completed: { label: "Completed", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground line-through" },
};

export function PackageBadge({ state, className }: { state: PackageState | null; className?: string }) {
  if (!state) {
    return (
      <Badge variant="outline" className={cn("rounded-full border-dashed text-muted-foreground", className)}>
        No package
      </Badge>
    );
  }
  const style = styles[state];
  return (
    <Badge className={cn("rounded-full border-transparent font-semibold", style.className, className)}>
      {style.label}
    </Badge>
  );
}
