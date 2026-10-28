import type { SeriesPoint } from "@/lib/attendance/queries";
import { formatMonth, formatShortDay } from "@/lib/attendance/time";
import { cn } from "@/lib/utils";

/**
 * Dependency-free SVG charts for the attendance page. They render on the
 * server; hovering a bar shows its value through a plain <title>.
 */

type Bar = { key: string; label: string; value: number; secondary?: number; selected?: boolean; title: string };

function BarChart({
  bars,
  height = 220,
  labelEvery = 1,
  ariaLabel,
  showSecondary = false,
}: {
  bars: Bar[];
  height?: number;
  labelEvery?: number;
  ariaLabel: string;
  showSecondary?: boolean;
}) {
  const width = 720;
  const pad = { top: 12, right: 8, bottom: 26, left: 30 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const max = Math.max(1, ...bars.map((b) => b.value));
  const niceMax = niceCeil(max);
  const slot = plotW / Math.max(bars.length, 1);
  const gap = Math.min(8, slot * 0.25);
  const barW = Math.max(2, slot - gap);
  const y = (v: number) => pad.top + plotH - (v / niceMax) * plotH;
  const ticks = [0, niceMax / 2, niceMax];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="currentColor" className="text-border" strokeDasharray={t === 0 ? undefined : "3 4"} />
          <text x={pad.left - 6} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
            {t}
          </text>
        </g>
      ))}
      {bars.map((b, i) => {
        const x = pad.left + i * slot + gap / 2;
        const h = Math.max(b.value > 0 ? 2 : 0, (b.value / niceMax) * plotH);
        const sh = showSecondary && b.secondary ? Math.max(2, (b.secondary / niceMax) * plotH) : 0;
        return (
          <g key={b.key}>
            <title>{b.title}</title>
            <rect x={x} y={pad.top} width={barW} height={plotH} className="fill-transparent" />
            <rect
              x={x}
              y={y(b.value)}
              width={barW}
              height={h}
              rx={Math.min(4, barW / 2)}
              className={cn(b.selected ? "fill-brand-700" : "fill-foreground", b.value === 0 && "fill-transparent")}
            />
            {sh > 0 ? <rect x={x} y={y(b.secondary ?? 0)} width={barW} height={sh} rx={Math.min(4, barW / 2)} className="fill-accent-strong" /> : null}
            {i % labelEvery === 0 || i === bars.length - 1 ? (
              <text
                x={x + barW / 2}
                y={height - 8}
                textAnchor="middle"
                className={cn("text-[11px] font-medium", b.selected ? "fill-foreground" : "fill-muted-foreground")}
              >
                {b.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function niceCeil(value: number): number {
  if (value <= 5) return 5;
  if (value <= 10) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = magnitude / 2;
  return Math.ceil(value / step) * step;
}

/** Visits per day (or per month in the 12-month view), with unique members as the lighter inner bar. */
export function VisitsChart({ series, unit, selectedKey }: { series: SeriesPoint[]; unit: "day" | "month"; selectedKey: string }) {
  const bars: Bar[] = series.map((p) => ({
    key: p.key,
    label: unit === "month" ? formatMonth(p.key) : formatShortDay(p.key),
    value: p.visits,
    secondary: p.members,
    selected: unit === "month" ? p.key === selectedKey.slice(0, 7) : p.key === selectedKey,
    title: `${unit === "month" ? formatMonth(p.key) : formatShortDay(p.key)}: ${p.visits} check-in${p.visits === 1 ? "" : "s"}, ${p.members} member${p.members === 1 ? "" : "s"}`,
  }));
  const labelEvery = unit === "month" ? 1 : series.length > 60 ? 10 : series.length > 20 ? 5 : series.length > 14 ? 2 : 1;
  return (
    <div className="space-y-2">
      <BarChart bars={bars} labelEvery={labelEvery} ariaLabel="Bar chart of check-ins over time" showSecondary />
      <p className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-[3px] bg-foreground" /> Check-ins
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-[3px] bg-accent-strong" /> Members (unique)
        </span>
      </p>
    </div>
  );
}

const hourLabel = (h: number) => (h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`);

/** When people come in: check-ins by hour of day. Trimmed to the busy part of the day. */
export function HourChart({ byHour }: { byHour: number[] }) {
  let first = byHour.findIndex((v) => v > 0);
  let last = byHour.length - 1 - [...byHour].reverse().findIndex((v) => v > 0);
  if (first === -1) {
    first = 6;
    last = 21;
  }
  first = Math.min(first, 6);
  last = Math.max(last, 21);
  const bars: Bar[] = [];
  for (let h = first; h <= last; h++) {
    const value = byHour[h] ?? 0;
    bars.push({ key: String(h), label: hourLabel(h), value, title: `${hourLabel(h)}–${hourLabel(h + 1)}: ${value} check-in${value === 1 ? "" : "s"}` });
  }
  return <BarChart bars={bars} height={180} labelEvery={bars.length > 12 ? 2 : 1} ariaLabel="Bar chart of check-ins by hour of day" />;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeekdayChart({ byWeekday }: { byWeekday: number[] }) {
  const bars: Bar[] = WEEKDAYS.map((label, i) => ({
    key: label,
    label,
    value: byWeekday[i] ?? 0,
    title: `${label}: ${byWeekday[i] ?? 0} check-in${byWeekday[i] === 1 ? "" : "s"}`,
  }));
  return <BarChart bars={bars} height={180} ariaLabel="Bar chart of check-ins by weekday" />;
}
