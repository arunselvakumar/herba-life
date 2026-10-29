"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { ChevronLeftIcon, ChevronRightIcon, LoaderCircleIcon, MoonIcon, SunIcon, SunriseIcon, UserRoundIcon, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CalendarMonth, CalendarVisit } from "@/lib/attendance/calendar";
import { loadOlderAttendanceMonths } from "@/lib/attendance/calendar-actions";
import type { Period } from "@/lib/attendance/constants";
import { cn } from "@/lib/utils";

/**
 * Attendance as a calendar strip: one block per month with the month on top
 * and the numbered days underneath, laid out like a wall calendar and laid
 * side by side like a timeline. Days the member came in are green; more
 * visits, darker green. The strip scrolls sideways, newest month on the
 * right, and keeps loading older months as you go back.
 */

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const monthTitle = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" });
const longDate = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

const PERIOD_ICON: Record<Period, LucideIcon> = { morning: SunriseIcon, afternoon: SunIcon, evening: MoonIcon };
const PERIOD_LABEL: Record<Period, string> = { morning: "Morning", afternoon: "Afternoon", evening: "Evening" };

/** Visit count → shade. 0 stays grey; 1, 2 and 3+ step through the brand greens. */
function shade(visits: number): string {
  if (visits >= 3) return "bg-(--hl-garden-green) text-white";
  if (visits === 2) return "bg-(--hl-grass) text-white";
  if (visits === 1) return "bg-(--hl-mint) text-(--hl-evergreen)";
  return "bg-muted text-muted-foreground";
}

function daysIn(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(y ?? 1970, m ?? 1, 0).getDate();
}

/** Monday-first column (0–6) of the first day of the month. */
function startOffset(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return (new Date(y ?? 1970, (m ?? 1) - 1, 1).getDay() + 6) % 7;
}

function dayKey(month: string, day: number): string {
  return `${month}-${String(day).padStart(2, "0")}`;
}

type Hovered = { day: string; visits: CalendarVisit[]; rect: DOMRect };

export function MemberCalendar({
  memberId,
  initialMonths,
  initialHasMore,
  today,
  joinedOn,
}: {
  memberId: string;
  initialMonths: CalendarMonth[];
  initialHasMore: boolean;
  today: string;
  joinedOn: string;
}) {
  const [months, setMonths] = useState(initialMonths);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, startLoading] = useTransition();
  const [hovered, setHovered] = useState<Hovered | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLLIElement>(null);
  // Width before a prepend, so the view can stay on the same month afterwards.
  const pendingPrepend = useRef<number | null>(null);
  const exhausted = useRef(!initialHasMore);

  // Start at the newest month.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  // After older months arrive, shift the scroll position by the added width.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el || pendingPrepend.current === null) return;
    el.scrollLeft += el.scrollWidth - pendingPrepend.current;
    pendingPrepend.current = null;
  }, [months]);

  const loadMore = useCallback(() => {
    const el = scrollerRef.current;
    const oldest = months[0];
    if (!el || !oldest || exhausted.current || loading) return;
    exhausted.current = true; // one request in flight at a time; reopened below when more exist
    startLoading(async () => {
      const result = await loadOlderAttendanceMonths(memberId, oldest.month);
      pendingPrepend.current = el.scrollWidth;
      setMonths((prev) => (result.months.length > 0 ? [...result.months, ...prev] : prev));
      setHasMore(result.hasMore);
      exhausted.current = !result.hasMore;
    });
  }, [loading, memberId, months]);

  function onScroll() {
    const el = scrollerRef.current;
    if (el && el.scrollLeft < 160) loadMore();
    if (hovered) setHovered(null);
  }

  // A strip too short to scroll can never trigger `onScroll`; fetch until it can.
  useEffect(() => {
    const el = scrollerRef.current;
    if (el && hasMore && !loading && el.scrollWidth <= el.clientWidth) loadMore();
  }, [hasMore, loading, loadMore, months]);

  // Belt and braces for the scroll handler: a sentinel at the oldest end
  // requests more as soon as it comes into view, however the user got there.
  useEffect(() => {
    const el = scrollerRef.current;
    const sentinel = sentinelRef.current;
    if (!el || !sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { root: el, rootMargin: "0px 0px 0px 200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  function page(direction: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(el.clientWidth - 80, 160), behavior: "smooth" });
  }

  function jumpToToday() {
    const el = scrollerRef.current;
    if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }

  function show(event: React.SyntheticEvent<HTMLElement>, day: string, visits: CalendarVisit[]) {
    if (visits.length === 0) return;
    setHovered({ day, visits, rect: event.currentTarget.getBoundingClientRect() });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Legend />
        <div className="flex items-center gap-1">
          {loading ? <LoaderCircleIcon className="mr-1 size-3.5 animate-spin text-muted-foreground" aria-label="Loading older months" /> : null}
          <Button type="button" variant="outline" size="icon-sm" onClick={() => page(-1)} aria-label="Earlier months">
            <ChevronLeftIcon />
          </Button>
          <Button type="button" variant="outline" size="icon-sm" onClick={() => page(1)} aria-label="Later months">
            <ChevronRightIcon />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={jumpToToday}>
            Today
          </Button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onScroll={onScroll}
        onMouseLeave={() => setHovered(null)}
        className="-mx-5 overflow-x-auto overscroll-x-contain px-5 pb-2 [mask-image:linear-gradient(to_right,transparent,black_1.25rem,black_calc(100%-1.25rem),transparent)] [scrollbar-color:var(--hl-hairline)_transparent] [scrollbar-width:thin]"
        aria-label="Attendance by month"
      >
        <ol className="flex w-max items-start gap-5">
          {hasMore ? <li ref={sentinelRef} aria-hidden className="w-px shrink-0 self-stretch" /> : null}
          {!hasMore && months[0] ? (
            <li className="flex h-[12.5rem] w-14 shrink-0 flex-col items-center justify-center gap-2 text-center">
              <span className="h-10 w-px bg-border" />
              <span className="text-[0.65rem] leading-tight font-medium text-muted-foreground">
                Joined
                <br />
                {monthTitle.format(new Date(Number(joinedOn.slice(0, 4)), Number(joinedOn.slice(5, 7)) - 1, 1)).replace(" ", " ")}
              </span>
              <span className="h-10 w-px bg-border" />
            </li>
          ) : null}
          {months.map((m) => (
            <MonthBlock key={m.month} month={m} today={today} joinedOn={joinedOn} onShow={show} onHide={() => setHovered(null)} />
          ))}
        </ol>
      </div>

      {hovered ? <HoverCard hovered={hovered} /> : null}
    </div>
  );
}

function MonthBlock({
  month,
  today,
  joinedOn,
  onShow,
  onHide,
}: {
  month: CalendarMonth;
  today: string;
  joinedOn: string;
  onShow: (event: React.SyntheticEvent<HTMLElement>, day: string, visits: CalendarVisit[]) => void;
  onHide: () => void;
}) {
  const total = daysIn(month.month);
  const offset = startOffset(month.month);
  const [y, m] = month.month.split("-").map(Number);
  const title = monthTitle.format(new Date(y ?? 1970, (m ?? 1) - 1, 1));
  const current = month.month === today.slice(0, 7);

  return (
    <li className="shrink-0" data-month={month.month}>
      <div className="mb-2 flex items-baseline justify-between gap-3 px-0.5">
        <span className={cn("text-sm font-semibold", current ? "text-foreground" : "text-foreground/80")}>{title}</span>
        <span className={cn("text-xs tabular-nums", month.visits > 0 ? "font-semibold text-(--hl-garden-green)" : "text-muted-foreground/70")}>
          {month.visits > 0 ? `${month.visits} visit${month.visits === 1 ? "" : "s"}` : "—"}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w, i) => (
          <span key={i} aria-hidden className="h-4 text-center text-[0.6rem] leading-4 font-medium text-muted-foreground/60">
            {w}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`pad-${i}`} aria-hidden />
        ))}
        {Array.from({ length: total }, (_, i) => {
          const day = i + 1;
          const key = dayKey(month.month, day);
          const visits = month.days[day] ?? [];
          const future = key > today;
          const beforeJoin = key < joinedOn;
          const isToday = key === today;
          const label =
            visits.length === 0
              ? `${longDate.format(new Date(y ?? 1970, (m ?? 1) - 1, day))}: no visit`
              : `${longDate.format(new Date(y ?? 1970, (m ?? 1) - 1, day))}: ${visits.length} visit${visits.length === 1 ? "" : "s"} at ${visits.map((v) => v.time).join(", ")}`;
          return (
            <button
              key={day}
              type="button"
              tabIndex={visits.length > 0 ? 0 : -1}
              aria-label={label}
              data-visits={visits.length}
              onMouseEnter={(e) => onShow(e, key, visits)}
              onFocus={(e) => onShow(e, key, visits)}
              onBlur={onHide}
              className={cn(
                "flex size-7 items-center justify-center rounded-md text-[0.7rem] font-medium tabular-nums transition-[transform,box-shadow] duration-150 outline-none select-none",
                future ? "bg-transparent text-muted-foreground/35" : shade(visits.length),
                beforeJoin && !future && visits.length === 0 && "bg-muted/50 text-muted-foreground/40",
                visits.length > 0 && "cursor-pointer hover:scale-110 hover:shadow-[0_6px_14px_-6px_rgb(17_17_17/0.45)] focus-visible:scale-110 focus-visible:ring-2 focus-visible:ring-foreground/40",
                visits.length === 0 && "cursor-default",
                isToday && "ring-2 ring-foreground ring-offset-1 ring-offset-card",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </li>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
      <span>Visits</span>
      {[0, 1, 2, 3].map((n) => (
        <span key={n} className={cn("flex size-4 items-center justify-center rounded-[4px] text-[0.55rem] font-semibold", shade(n))} aria-hidden>
          {n === 3 ? "3+" : n}
        </span>
      ))}
      <span className="hidden sm:inline">· hover a day for the times</span>
    </div>
  );
}

const CARD_WIDTH = 232;

/** The floating detail for the hovered day: every check-in with its time of day. */
function HoverCard({ hovered }: { hovered: Hovered }) {
  const { rect, visits, day } = hovered;
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  const above = rect.top > 180;
  const left = Math.min(Math.max(rect.left + rect.width / 2 - CARD_WIDTH / 2, 8), window.innerWidth - CARD_WIDTH - 8);
  const style: React.CSSProperties = above
    ? { left, top: rect.top - 10, transform: "translateY(-100%)" }
    : { left, top: rect.bottom + 10 };

  return createPortal(
    <div
      role="tooltip"
      style={style}
      className="pointer-events-none fixed z-50 w-[232px] animate-in rounded-2xl bg-foreground p-3 text-background shadow-float fade-in-0 zoom-in-95 duration-150"
    >
      <p className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-semibold">{longDate.format(date)}</span>
        <span className="text-background/60 tabular-nums">
          {visits.length} visit{visits.length === 1 ? "" : "s"}
        </span>
      </p>
      <ol className="mt-2 space-y-1.5">
        {visits.map((v) => {
          const Icon = PERIOD_ICON[v.period];
          return (
            <li key={v.id} className="flex items-start gap-2.5 text-sm">
              <span className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-background/12">
                <Icon className="size-3.5" aria-label={PERIOD_LABEL[v.period]} />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block font-semibold tabular-nums">{v.time}</span>
                <span className="block truncate text-[0.7rem] text-background/60">
                  {v.source === "manual" ? (
                    <span className="inline-flex items-center gap-1">
                      <UserRoundIcon className="size-2.5" aria-hidden />
                      Recorded by {v.recordedBy ?? "staff"}
                    </span>
                  ) : (
                    "Self check-in"
                  )}
                  {v.note ? ` · ${v.note}` : ""}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      <span
        aria-hidden
        className={cn(
          "absolute left-1/2 size-2.5 -translate-x-1/2 rotate-45 rounded-[2px] bg-foreground",
          above ? "-bottom-1" : "-top-1",
        )}
      />
    </div>,
    document.body,
  );
}
