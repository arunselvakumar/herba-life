import type { MonthlySales } from "@/lib/dashboard-data";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SalesChartProps = {
  data: readonly MonthlySales[];
};

/**
 * Dependency-free stacked bar chart. Static data, so plain SVG keeps the
 * bundle lean and renders in the prerendered shell.
 */
export function SalesChart({ data }: SalesChartProps) {
  const width = 720;
  const height = 240;
  const paddingX = 8;
  const paddingBottom = 28;
  const paddingTop = 12;
  const max = Math.max(...data.map((d) => d.retail + d.wholesale)) * 1.1;
  const slot = (width - paddingX * 2) / data.length;
  const barWidth = slot * 0.55;
  const plotHeight = height - paddingBottom - paddingTop;
  const scale = (value: number) => (value / max) * plotHeight;

  return (
    <Card className="ring-stone/80">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Sales performance</CardTitle>
        <CardDescription>Retail vs. wholesale, last 12 months (USD, millions)</CardDescription>
        <CardAction className="flex gap-2">
          <Badge variant="outline" className="gap-1.5">
            <span className="size-2 rounded-full bg-brand-600" /> Retail
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <span className="size-2 rounded-full bg-brand-200" /> Wholesale
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          role="img"
          aria-label="Stacked bar chart of monthly retail and wholesale sales"
        >
          {[0.25, 0.5, 0.75, 1].map((step) => {
            const y = paddingTop + plotHeight - plotHeight * step;
            return (
              <line
                key={step}
                x1={paddingX}
                x2={width - paddingX}
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-border"
                strokeDasharray="3 4"
              />
            );
          })}
          {data.map((d, index) => {
            const x = paddingX + slot * index + (slot - barWidth) / 2;
            const retailHeight = scale(d.retail);
            const wholesaleHeight = scale(d.wholesale);
            const baseY = paddingTop + plotHeight;
            return (
              <g key={d.month}>
                <rect
                  x={x}
                  y={baseY - retailHeight}
                  width={barWidth}
                  height={retailHeight}
                  rx={4}
                  className="fill-brand-600"
                />
                <rect
                  x={x}
                  y={baseY - retailHeight - wholesaleHeight}
                  width={barWidth}
                  height={wholesaleHeight}
                  rx={4}
                  className="fill-brand-200"
                />
                <text
                  x={x + barWidth / 2}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[11px] font-medium"
                >
                  {d.month}
                </text>
              </g>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}
