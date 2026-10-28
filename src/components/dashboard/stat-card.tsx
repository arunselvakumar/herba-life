import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type Stat = {
  id: string;
  label: string;
  value: string | number;
  hint: string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "brand";
};

const tones = {
  default: "bg-muted text-muted-foreground",
  brand: "bg-brand-100 text-brand-700",
  warning: "bg-warning/20 text-amber-800",
} as const;

export function StatCard({ stat }: { stat: Stat }) {
  const Icon = stat.icon;
  return (
    <Card className="ring-stone/80">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div className="space-y-1">
          <CardDescription className="text-eyebrow text-[0.65rem] text-muted-foreground">
            {stat.label}
          </CardDescription>
          <CardTitle className="font-heading text-3xl font-extrabold tracking-tight tabular-nums">
            {stat.value}
          </CardTitle>
        </div>
        <span className={cn("flex size-9 items-center justify-center rounded-full", tones[stat.tone ?? "default"])}>
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{stat.hint}</CardContent>
    </Card>
  );
}
