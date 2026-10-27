import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const palette = ["bg-brand-600", "bg-brand-500", "bg-brand-200", "bg-brand-100"] as const;

export function RegionMix({
  regions,
}: {
  regions: readonly { region: string; share: number }[];
}) {
  return (
    <Card className="ring-stone/80">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Sales by region</CardTitle>
        <CardDescription>Share of net sales, month to date</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {regions.map((r, i) => (
            <div
              key={r.region}
              style={{ width: `${r.share}%` }}
              className={palette[i % palette.length]}
              aria-hidden
            />
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {regions.map((r, i) => (
            <li key={r.region} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${palette[i % palette.length]}`} />
                {r.region}
              </span>
              <span className="font-semibold tabular-nums">{r.share}%</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
