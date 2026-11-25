import { Badge } from "@/components/ui/badge";
import { PACKAGE_STATE_LABELS, type PackageState } from "@/lib/members/format";
import { cn } from "@/lib/utils";

const styles: Record<PackageState, string> = {
  active: "bg-brand-100 text-brand-700",
  low: "bg-warning/20 text-amber-800",
  upcoming: "bg-accent-soft/60 text-foreground",
  used_up: "bg-destructive/10 text-destructive",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground line-through",
};

export function PackageBadge({ state, className }: { state: PackageState | null; className?: string }) {
  if (!state) {
    return (
      <Badge variant="outline" className={cn("rounded-full border-dashed text-muted-foreground", className)}>
        No package
      </Badge>
    );
  }
  return (
    <Badge className={cn("rounded-full border-transparent font-semibold", styles[state], className)}>
      {PACKAGE_STATE_LABELS[state]}
    </Badge>
  );
}
