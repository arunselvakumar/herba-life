import { formatNumber, type RangeVerdict } from "@/lib/members/format";
import { cn } from "@/lib/utils";

const verdictClass: Record<Exclude<RangeVerdict, null>, string> = {
  ok: "text-brand-700",
  low: "text-sky-700",
  high: "text-amber-700",
};

export function MeasurementValue({
  value,
  verdict,
  unit,
  digits = 1,
  className,
}: {
  value: number | null | undefined;
  verdict?: RangeVerdict;
  unit?: string;
  digits?: number;
  className?: string;
}) {
  if (value === null || value === undefined) {
    return <span className={cn("text-muted-foreground", className)}>—</span>;
  }
  return (
    <span className={cn("tabular-nums", verdict ? verdictClass[verdict] : undefined, className)}>
      {formatNumber(value, digits)}
      {unit ? <span className="ml-0.5 text-[0.7em] text-muted-foreground">{unit}</span> : null}
    </span>
  );
}

export function Delta({ current, previous, invert = false }: { current: number | null; previous: number | null; invert?: boolean }) {
  if (current === null || previous === null) return null;
  const diff = Math.round((current - previous) * 10) / 10;
  if (diff === 0) return <span className="ml-1 text-[0.65rem] text-muted-foreground">±0</span>;
  // For weight, fat, waist a drop is good; `invert` flips that for muscle mass.
  const good = invert ? diff > 0 : diff < 0;
  return (
    <span className={cn("ml-1 text-[0.65rem] font-semibold tabular-nums", good ? "text-brand-700" : "text-amber-700")}>
      {diff > 0 ? "+" : ""}
      {diff}
    </span>
  );
}
