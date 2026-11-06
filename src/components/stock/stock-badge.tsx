import { Badge } from "@/components/ui/badge";
import { STOCK_STATE_LABELS, type StockState } from "@/lib/stock/format";
import { cn } from "@/lib/utils";

const styles: Record<StockState, string> = {
  in_stock: "bg-brand-100 text-brand-700",
  low: "bg-warning/20 text-amber-800",
  out: "bg-destructive/10 text-destructive",
  archived: "bg-muted text-muted-foreground",
};

export function StockBadge({ state, className }: { state: StockState; className?: string }) {
  return (
    <Badge className={cn("rounded-full border-transparent font-semibold", styles[state], className)}>
      {STOCK_STATE_LABELS[state]}
    </Badge>
  );
}

export function VoidedBadge({ className }: { className?: string }) {
  return (
    <Badge className={cn("rounded-full border-transparent bg-destructive/10 font-semibold text-destructive", className)}>
      Voided
    </Badge>
  );
}

export function BalanceBadge({ balance, className }: { balance: number; className?: string }) {
  if (balance <= 0) return null;
  return (
    <Badge className={cn("rounded-full border-transparent bg-warning/20 font-semibold text-amber-800", className)}>
      Balance due
    </Badge>
  );
}
