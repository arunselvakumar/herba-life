"use client";

import { useState } from "react";
import { BarChart, type Bar } from "@/components/attendance/charts";
import { Checkbox } from "@/components/ui/checkbox";
import type { SeriesPoint } from "@/lib/attendance/queries";
import { formatMonth, formatShortDay } from "@/lib/attendance/time";
import { cn } from "@/lib/utils";

/**
 * Visits per day (or per month in the 12-month view). The legend doubles as a
 * toggle: unique members on its own by default, check-ins on their own, or
 * both with members as the lighter inner bar. One series always stays on.
 */
export function VisitsChart({ series, unit, selectedKey }: { series: SeriesPoint[]; unit: "day" | "month"; selectedKey: string }) {
  const [showMembers, setShowMembers] = useState(true);
  const [showVisits, setShowVisits] = useState(false);

  const bars: Bar[] = series.map((p) => ({
    key: p.key,
    label: unit === "month" ? formatMonth(p.key) : formatShortDay(p.key),
    value: showVisits ? p.visits : p.members,
    secondary: p.members,
    selected: unit === "month" ? p.key === selectedKey.slice(0, 7) : p.key === selectedKey,
    title: `${unit === "month" ? formatMonth(p.key) : formatShortDay(p.key)}: ${p.visits} check-in${p.visits === 1 ? "" : "s"}, ${p.members} member${p.members === 1 ? "" : "s"}`,
  }));
  const labelEvery = unit === "month" ? 1 : series.length > 60 ? 10 : series.length > 20 ? 5 : series.length > 14 ? 2 : 1;
  const shown = [showMembers && "unique members", showVisits && "check-ins"].filter(Boolean).join(" and ");

  return (
    <div className="space-y-2">
      <BarChart
        bars={bars}
        labelEvery={labelEvery}
        ariaLabel={`Bar chart of ${shown} over time`}
        showSecondary={showVisits && showMembers}
        tone={showVisits ? "foreground" : "accent"}
      />
      <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <legend className="sr-only">Series to show</legend>
        <SeriesToggle label="Unique members" swatch="bg-accent-strong" checked={showMembers} lone={!showVisits} onChange={setShowMembers} />
        <SeriesToggle label="Check-ins" swatch="bg-foreground" checked={showVisits} lone={!showMembers} onChange={setShowVisits} />
      </fieldset>
    </div>
  );
}

function SeriesToggle({
  label,
  swatch,
  checked,
  lone,
  onChange,
}: {
  label: string;
  swatch: string;
  checked: boolean;
  /** The only series still on: it can't be switched off, or the chart would be empty. */
  lone: boolean;
  onChange: (checked: boolean) => void;
}) {
  const locked = checked && lone;
  return (
    <label
      className={cn("inline-flex items-center gap-2 select-none", locked ? "cursor-default" : "cursor-pointer hover:text-foreground")}
      title={locked ? "At least one series stays on" : undefined}
    >
      <Checkbox checked={checked} disabled={locked} onCheckedChange={(value) => onChange(value === true)} className="size-4 disabled:opacity-100" />
      <span className={cn("inline-block size-2.5 rounded-[3px]", swatch, !checked && "opacity-35")} aria-hidden />
      <span className={cn(checked && "font-medium text-foreground")}>{label}</span>
    </label>
  );
}
