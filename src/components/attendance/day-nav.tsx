"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDaysIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Range } from "@/lib/attendance/constants";
import { formatCompactDate, formatLongDate, relativeDay } from "@/lib/attendance/time";
import { addDays, calendarDay, parseDay } from "@/lib/members/dates";
import { cn } from "@/lib/utils";

/** How far back the month/year dropdowns reach. */
const YEARS_BACK = 10;

/** Step through days or jump with the calendar; the chart range travels along in the URL. */
export function DayNav({ day, today, range }: { day: string; today: string; range: Range }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function go(next: string) {
    setOpen(false);
    if (next === day) return;
    const params = new URLSearchParams();
    if (next !== today) params.set("day", next);
    if (range !== "30d") params.set("range", range);
    const qs = params.toString();
    startTransition(() => router.push(qs ? `/attendance?${qs}` : "/attendance"));
  }

  const relative = relativeDay(day, today);
  const todayDate = parseDay(today);
  const shortcuts = [
    { label: "Today", day: today },
    { label: "Yesterday", day: addDays(today, -1) },
    { label: "A week ago", day: addDays(today, -7) },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex max-w-full min-w-0 items-center gap-1 rounded-full border border-border bg-card p-1 shadow-card">
        <Button type="button" variant="ghost" size="icon" onClick={() => go(addDays(day, -1))} aria-label="Previous day">
          <ChevronLeftIcon />
        </Button>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className={cn("h-10 min-w-0 shrink gap-2.5 pr-3 pl-1.5 text-[0.95rem]", pending && "opacity-60")}
              aria-label={`Pick a day, ${formatLongDate(day)} selected`}
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <CalendarDaysIcon className="size-4" />
              </span>
              <span className="truncate sm:hidden">{formatCompactDate(day)}</span>
              <span className="hidden sm:inline">{formatLongDate(day)}</span>
              {relative === "Today" || relative === "Yesterday" ? (
                <span className="hidden rounded-full bg-muted px-2 py-0.5 text-xs font-semibold sm:inline text-muted-foreground">{relative}</span>
              ) : null}
              <ChevronDownIcon className={cn("size-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-2">
            <Calendar
              mode="single"
              required
              selected={parseDay(day)}
              onSelect={(date) => go(calendarDay(date))}
              defaultMonth={parseDay(day)}
              captionLayout="dropdown"
              startMonth={new Date(todayDate.getFullYear() - YEARS_BACK, 0)}
              endMonth={todayDate}
              disabled={{ after: todayDate }}
              autoFocus
            />
            <div className="flex items-center gap-1.5 border-t border-border px-1 pt-2.5 pb-0.5">
              {shortcuts.map((shortcut) => (
                <Button
                  key={shortcut.label}
                  type="button"
                  variant={shortcut.day === day ? "default" : "secondary"}
                  size="xs"
                  onClick={() => go(shortcut.day)}
                >
                  {shortcut.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button type="button" variant="ghost" size="icon" onClick={() => go(addDays(day, 1))} aria-label="Next day" disabled={day >= today}>
          <ChevronRightIcon />
        </Button>
      </div>

      {day !== today ? (
        <Button type="button" variant="outline" size="lg" onClick={() => go(today)}>
          Back to today
        </Button>
      ) : null}
    </div>
  );
}
