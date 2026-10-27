import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stat } from "@/lib/dashboard-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const trendStyles = {
  up: { icon: ArrowUpRightIcon, className: "bg-brand-100 text-brand-700" },
  down: { icon: ArrowDownRightIcon, className: "bg-destructive/10 text-destructive" },
  flat: { icon: MinusIcon, className: "bg-muted text-muted-foreground" },
} as const;

export function StatCard({ stat }: { stat: Stat }) {
  const trend = trendStyles[stat.trend];
  const TrendIcon = trend.icon;

  return (
    <Card className="ring-stone/80">
      <CardHeader>
        <CardDescription className="text-eyebrow text-[0.65rem] text-muted-foreground">
          {stat.label}
        </CardDescription>
        <CardTitle className="font-heading text-3xl font-extrabold tracking-tight">
          {stat.value}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold",
            trend.className,
          )}
        >
          <TrendIcon className="size-3" />
          {stat.delta}
        </span>
        <span>{stat.hint}</span>
      </CardContent>
    </Card>
  );
}
