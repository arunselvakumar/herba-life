import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CountUp } from "@/components/motion/count-up";
import { GrowBar } from "@/components/motion/grow-bar";

export type Stat = {
  id: string;
  label: string;
  value: string | number;
  hint: string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "brand";
  /** Where the corner arrow takes you. Without it the icon is shown instead. */
  href?: string;
  /** A 0–1 share drawn as a slim bar under the figure, e.g. active ÷ total. */
  progress?: { value: number; tone?: "ink" | "leaf"; label: string };
};

const tones = {
  default: "bg-muted text-foreground",
  brand: "bg-primary text-primary-foreground",
  warning: "bg-warning/20 text-foreground",
} as const;

/**
 * One figure per card: a quiet label, a large number that counts up, and a
 * round corner button that opens the module. Cards with a `progress` share
 * also draw the console's slim bar beneath the figure.
 */
export function StatCard({ stat, className }: { stat: Stat; className?: string }) {
  const Icon = stat.icon;
  const corner = (
    <span
      className={cn(
        "flex size-10 items-center justify-center rounded-full transition-[background-color,color,transform] duration-300 ease-out-expo",
        stat.href ? "bg-muted text-foreground group-hover/card:bg-primary group-hover/card:text-primary-foreground" : tones[stat.tone ?? "default"],
      )}
    >
      {stat.href ? <ArrowUpRightIcon className="size-4 transition-transform duration-300 ease-out-expo group-hover/card:translate-x-px group-hover/card:-translate-y-px" /> : <Icon className="size-4" />}
    </span>
  );

  return (
    <Card data-reveal data-lift={stat.href ? "" : undefined} className={cn("relative", className)}>
      <CardHeader>
        <CardDescription className="text-eyebrow">{stat.label}</CardDescription>
        <CardTitle className="mt-1 text-[2rem] leading-none font-semibold tracking-[-0.03em] tabular-nums md:text-[2.25rem]">
          {typeof stat.value === "number" ? <CountUp value={stat.value} /> : stat.value}
        </CardTitle>
        <CardAction>
          {stat.href ? (
            <Link href={stat.href} aria-label={`Open ${stat.label}`} className="rounded-full outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:ring-3 focus-visible:ring-ring/15">
              {corner}
            </Link>
          ) : (
            corner
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{stat.hint}</p>
        {stat.progress ? <GrowBar value={stat.progress.value} tone={stat.progress.tone} label={stat.progress.label} /> : null}
      </CardContent>
    </Card>
  );
}
