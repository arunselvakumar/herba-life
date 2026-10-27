import { compact, type Distributor } from "@/lib/dashboard-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function TopDistributors({
  distributors,
}: {
  distributors: readonly Distributor[];
}) {
  return (
    <Card className="ring-stone/80">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Top distributors</CardTitle>
        <CardDescription>Volume points against monthly target</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {distributors.map((d) => {
          const pct = Math.min(100, Math.round((d.volumePoints / d.target) * 100));
          return (
            <div key={d.id} className="space-y-2">
              <div className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-brand-100 text-xs font-bold text-brand-700">
                    {initials(d.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{d.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {d.level} · {d.region}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {compact.format(d.volumePoints)}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    of {compact.format(d.target)} VP
                  </p>
                </div>
              </div>
              <Progress
                value={pct}
                aria-label={`${d.name}: ${pct}% of target`}
                className="h-1.5 bg-muted [&>[data-slot=progress-indicator]]:bg-brand-500"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
