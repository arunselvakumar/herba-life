"use client";

import { useRouter } from "next/navigation";
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Range } from "@/lib/attendance/constants";
import { formatLongDate, relativeDay } from "@/lib/attendance/time";
import { addDays } from "@/lib/members/dates";

/** Step through days or jump with the date picker; the chart range travels along in the URL. */
export function DayNav({ day, today, range }: { day: string; today: string; range: Range }) {
  const router = useRouter();

  function go(next: string) {
    const params = new URLSearchParams();
    if (next !== today) params.set("day", next);
    if (range !== "30d") params.set("range", range);
    const qs = params.toString();
    router.push(qs ? `/attendance?${qs}` : "/attendance");
  }

  const relative = relativeDay(day, today);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="icon-lg" onClick={() => go(addDays(day, -1))} aria-label="Previous day">
        <ChevronLeftIcon />
      </Button>
      <Button type="button" variant="outline" size="icon-lg" onClick={() => go(addDays(day, 1))} aria-label="Next day" disabled={day >= today}>
        <ChevronRightIcon />
      </Button>
      <label className="relative flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-semibold">
        <CalendarDaysIcon className="size-4 text-brand-600" />
        <span>{formatLongDate(day)}</span>
        {relative === "Today" || relative === "Yesterday" ? <span className="text-xs font-medium text-muted-foreground">{relative}</span> : null}
        <input
          type="date"
          value={day}
          max={today}
          onChange={(e) => e.target.value && go(e.target.value)}
          aria-label="Pick a day"
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      {day !== today ? (
        <Button type="button" variant="ghost" size="lg" onClick={() => go(today)}>
          Today
        </Button>
      ) : null}
    </div>
  );
}
