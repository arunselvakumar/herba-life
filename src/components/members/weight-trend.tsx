import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDay } from "@/lib/members/dates";
import { formatNumber } from "@/lib/members/format";

type Point = { recordedOn: string; weightKg: number | null };

/**
 * Dependency-free line chart of the member's weight over their follow-ups.
 * Renders on the server as plain SVG.
 */
export function WeightTrend({ checkins }: { checkins: readonly Point[] }) {
  const points = checkins
    .filter((c): c is { recordedOn: string; weightKg: number } => c.weightKg !== null)
    .sort((a, b) => a.recordedOn.localeCompare(b.recordedOn));

  const first = points[0];
  const last = points[points.length - 1];
  const change = first && last && points.length > 1 ? Math.round((last.weightKg - first.weightKg) * 10) / 10 : null;

  return (
    <Card className="ring-stone/80">
      <CardHeader>
        <CardTitle className="text-base font-bold">Weight trend</CardTitle>
        <CardDescription>
          {change === null
            ? "Record at least two weights to see the trend."
            : `${change > 0 ? "+" : ""}${change} kg since ${formatDay(first?.recordedOn)}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {points.length < 2 ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Not enough data yet
          </div>
        ) : (
          <Chart points={points} />
        )}
      </CardContent>
    </Card>
  );
}

function Chart({ points }: { points: { recordedOn: string; weightKg: number }[] }) {
  const width = 640;
  const height = 200;
  const pad = { top: 16, right: 16, bottom: 28, left: 40 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const weights = points.map((p) => p.weightKg);
  const minW = Math.floor(Math.min(...weights) - 1);
  const maxW = Math.ceil(Math.max(...weights) + 1);
  const span = Math.max(maxW - minW, 1);

  const x = (i: number) => pad.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (w: number) => pad.top + plotH - ((w - minW) / span) * plotH;

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.weightKg).toFixed(1)}`).join(" ");
  const area = `${path} L${x(points.length - 1).toFixed(1)},${(pad.top + plotH).toFixed(1)} L${x(0).toFixed(1)},${(pad.top + plotH).toFixed(1)} Z`;
  const ticks = [minW, minW + span / 2, maxW];
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Line chart of weight over time">
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={pad.left}
            x2={width - pad.right}
            y1={y(t)}
            y2={y(t)}
            stroke="currentColor"
            className="text-border"
            strokeDasharray="3 4"
          />
          <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
            {formatNumber(t, 0)}
          </text>
        </g>
      ))}
      <path d={area} className="fill-brand-200/50" />
      <path d={path} fill="none" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" className="stroke-brand-600" />
      {points.map((p, i) => (
        <g key={p.recordedOn + i}>
          <circle cx={x(i)} cy={y(p.weightKg)} r={4} className="fill-card stroke-brand-600" strokeWidth={2} />
          {i % labelEvery === 0 || i === points.length - 1 ? (
            <text x={x(i)} y={height - 8} textAnchor="middle" className="fill-muted-foreground text-[11px] font-medium">
              {formatDay(p.recordedOn).replace(/ \d{4}$/, "")}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}
