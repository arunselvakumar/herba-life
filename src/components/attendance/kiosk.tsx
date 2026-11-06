"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { CheckIcon, LoaderCircleIcon, MaximizeIcon, MinimizeIcon, SearchIcon, UsersRoundIcon, XIcon } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { findKioskMobileMatches, kioskCheckIn, type KioskCheckInResult } from "@/lib/attendance/actions";
import {
  KIOSK_IDLE_SECONDS,
  KIOSK_REFRESH_MINUTES,
  KIOSK_SEARCH_LIMIT,
  KIOSK_WELCOME_SECONDS,
  MOBILE_SEARCH_DEBOUNCE_MS,
  MOBILE_SEARCH_MIN_DIGITS,
} from "@/lib/attendance/constants";
import type { KioskMember } from "@/lib/attendance/queries";
import { matchMembers, mobileNeedle, numberDigits } from "@/lib/attendance/search";
import { formatLongDate, formatTime } from "@/lib/attendance/time";
import { fullName } from "@/lib/members/format";
import { KioskExit } from "./kiosk-exit";
import { KioskResult } from "./kiosk-result";
import { MemberAvatar } from "./member-avatar";
import { MemberRail } from "./member-rail";

type View = { kind: "search" } | { kind: "confirm"; member: KioskMember } | { kind: "result"; member: KioskMember; result: KioskCheckInResult };

/**
 * Attendance Mode: the member-facing, full-screen check-in screen that runs
 * on the tablet at the entrance. Find yourself by name, mobile or member
 * number, tap, done. Only members on a running package are listed.
 *
 * Everything the screen needs is passed in from the server component; the
 * member list is re-fetched every few minutes with `router.refresh()` so new
 * members show up and the day rolls over at midnight.
 */
export function Kiosk({
  members,
  today,
  initialTodayVisits,
  staffName,
}: {
  members: KioskMember[];
  today: string;
  initialTodayVisits: number;
  staffName: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>({ kind: "search" });
  const [todayOverride, setTodayOverride] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const todayVisits = todayOverride ?? initialTodayVisits;
  const [mobileLookup, setMobileLookup] = useState<{ needle: string; ids: ReadonlySet<string> } | null>(null);
  const needle = mobileNeedle(query);
  const mobileMatches = needle && mobileLookup?.needle === needle ? mobileLookup.ids : undefined;
  const lookingUp = Boolean(needle) && !mobileMatches;
  const matches = matchMembers(members, query, query ? KIOSK_SEARCH_LIMIT : members.length, mobileMatches);

  const now = useClock();
  const fullscreen = useFullscreen();
  useWakeLock();

  // Periodic refresh: new members, and the server's idea of "today".
  useEffect(() => {
    const id = setInterval(() => {
      setTodayOverride(null);
      router.refresh();
    }, KIOSK_REFRESH_MINUTES * 60_000);
    return () => clearInterval(id);
  }, [router]);

  // Full mobile numbers stay on the server, so longer numbers are looked up there.
  useEffect(() => {
    if (!needle) return;
    let stale = false;
    const finish = (ids: string[]) => {
      if (!stale) setMobileLookup({ needle, ids: new Set(ids) });
    };
    const id = setTimeout(() => {
      findKioskMobileMatches(needle).then(finish, () => finish([]));
    }, MOBILE_SEARCH_DEBOUNCE_MS);
    return () => {
      stale = true;
      clearTimeout(id);
    };
  }, [needle]);

  // Back to the search screen after the welcome message, or if someone walks
  // away from the confirmation step.
  useEffect(() => {
    if (view.kind === "search") return;
    const seconds = view.kind === "result" ? KIOSK_WELCOME_SECONDS : KIOSK_IDLE_SECONDS;
    const id = setTimeout(() => reset(), seconds * 1000);
    return () => clearTimeout(id);
  }, [view]);

  function reset() {
    setView({ kind: "search" });
    setQuery("");
    inputRef.current?.focus();
  }

  function confirm(member: KioskMember) {
    startTransition(async () => {
      const result = await kioskCheckIn(member.id);
      if ("todayVisits" in result) setTodayOverride(result.todayVisits);
      // Their package ended since the list loaded, so take them off the screen.
      if (result.status === "no_package") router.refresh();
      setView({ kind: "result", member, result });
    });
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-4 bg-brand-600 px-5 py-3 text-white md:px-8">
        <LogoMark tone="white" className="h-9" />
        <div className="leading-tight">
          <p className="text-xs font-medium whitespace-nowrap text-white/70">Herbalife · Attendance</p>
          <p className="text-sm font-semibold">{now ? formatLongDate(today) : " "}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <p className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white/90 sm:flex">
            <UsersRoundIcon className="size-4" />
            <span className="tabular-nums">{todayVisits}</span> check-in{todayVisits === 1 ? "" : "s"} today
          </p>
          <time className="font-heading text-2xl font-semibold tracking-tight whitespace-nowrap tabular-nums md:text-3xl" suppressHydrationWarning>
            {now ? formatTime(now) : " "}
          </time>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-white/75 hover:bg-white/15 hover:text-white"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? "Exit full screen" : "Full screen"}
          >
            {fullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
          </Button>
          <KioskExit staffName={staffName} />
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 py-6 md:py-8">
        <div className="mx-auto w-full max-w-6xl px-4 text-center md:px-8">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Welcome! Tap your name to check in.</h1>
          <p className="mt-1 text-base text-muted-foreground md:text-lg">Search by your name, mobile number or member number.</p>
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 md:px-8">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-9 size-6 -translate-y-1/2 text-muted-foreground md:left-13" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, mobile or member number"
            aria-label="Search by name, mobile or member number"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck={false}
            enterKeyHint="search"
            className="h-16 w-full rounded-full border border-stone bg-card pr-16 pl-14 text-2xl font-medium shadow-card transition-[border-color,box-shadow] duration-300 outline-none placeholder:text-muted-foreground/60 focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/15 [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear"
              className="absolute top-1/2 right-7 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted md:right-11"
            >
              <XIcon className="size-5" />
            </button>
          ) : null}
        </div>

        {members.length === 0 ? (
          <Empty title="No active members yet" body="Only members with an active package can check in here. Please speak to a staff member." />
        ) : matches.length === 0 ? (
          <NoMatch query={query} lookingUp={lookingUp} />
        ) : (
          // Keyed on the result set so a new search gets a fresh belt and entrance.
          <MemberRail key={matches.map((m) => m.id).join("|")} members={matches} onPick={(member) => setView({ kind: "confirm", member })} />
        )}
      </main>

      <Dialog open={view.kind === "confirm"} onOpenChange={(open) => (open ? null : reset())}>
        <DialogContent className="gap-6 p-8 sm:max-w-lg" showCloseButton={false}>
          {view.kind === "confirm" ? (
            <>
              <div className="flex flex-col items-center gap-3 text-center">
                <MemberAvatar member={view.member} className="size-20 text-2xl" />
                <DialogTitle className="font-heading text-3xl font-semibold tracking-tight">{fullName(view.member)}</DialogTitle>
                <DialogDescription className="text-base">
                  Member #{view.member.serialNo}
                  {view.member.mobileHint ? ` · mobile ending ${view.member.mobileHint}` : null}
                  {` · ${view.member.packageName} package, ${describeDaysLeft(view.member.packageDaysLeft)}`}
                </DialogDescription>
              </div>
              <Button
                type="button"
                size="lg"
                className="h-16 w-full rounded-2xl text-xl font-bold"
                onClick={() => confirm(view.member)}
                disabled={pending}
              >
                {pending ? <LoaderCircleIcon className="size-6 animate-spin" /> : <CheckIcon className="size-6" strokeWidth={2.5} />}
                Yes, check me in
              </Button>
              <Button type="button" variant="ghost" size="lg" className="h-12 w-full text-base" onClick={reset} disabled={pending}>
                Not me
              </Button>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {view.kind === "result" ? (
        <KioskResult
          result={view.result}
          seconds={KIOSK_WELCOME_SECONDS}
          pkg={{ name: view.member.packageName, daysLeft: view.member.packageDaysLeft }}
          onDismiss={reset}
        />
      ) : null}
    </div>
  );
}

function describeDaysLeft(days: number): string {
  if (days === 0) return "its last day today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

/** What to say when a search finds nobody, which depends on what was typed. */
function NoMatch({ query, lookingUp }: { query: string; lookingUp: boolean }) {
  if (lookingUp) return <Empty title="Searching…" body="Looking up that number." />;
  const digits = numberDigits(query);
  if (digits && digits.length < MOBILE_SEARCH_MIN_DIGITS) {
    return <Empty title="Keep typing" body={`Enter your member number, or at least ${MOBILE_SEARCH_MIN_DIGITS} digits of your mobile.`} />;
  }
  return (
    <Empty
      title={`No one found for “${query}”`}
      body="Check the spelling or number and try again. Only members with an active package can check in here, so if you still cannot find yourself, please speak to a staff member."
    />
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-4 flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-stone p-10 text-center md:mx-8">
      <p className="text-xl font-bold">{title}</p>
      <p className="max-w-md text-muted-foreground">{body}</p>
    </div>
  );
}

/** Current time, ticking once a minute; `null` during server rendering so the markup matches. */
function useClock(): Date | null {
  const minute = useSyncExternalStore(
    (notify) => {
      const id = setInterval(notify, 10_000);
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / 60_000),
    () => null,
  );
  return minute === null ? null : new Date(minute * 60_000);
}

function useFullscreen(): boolean {
  return useSyncExternalStore(
    (notify) => {
      document.addEventListener("fullscreenchange", notify);
      return () => document.removeEventListener("fullscreenchange", notify);
    },
    () => Boolean(document.fullscreenElement),
    () => false,
  );
}

/** Keep the tablet screen awake while the kiosk is showing. Best effort; not every browser supports it. */
function useWakeLock() {
  useEffect(() => {
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    async function acquire() {
      if (!("wakeLock" in navigator) || document.visibilityState !== "visible") return;
      try {
        sentinel = await navigator.wakeLock.request("screen");
        if (cancelled) await sentinel.release();
      } catch {
        /* denied or unsupported */
      }
    }

    void acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", acquire);
      void sentinel?.release();
    };
  }, []);
}
