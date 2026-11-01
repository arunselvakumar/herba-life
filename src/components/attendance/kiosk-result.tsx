"use client";

import { useRef } from "react";
import { CalendarCheckIcon, ClockIcon, TicketIcon, type LucideIcon } from "lucide-react";
import { PixelMark } from "@/components/brand/pixel-mark";
import { MOTION, gsap, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";
import type { KioskCheckInResult } from "@/lib/attendance/actions";
import { cn } from "@/lib/utils";
import { ResultBadge } from "./result-badge";

export type KioskPackage = { name: string; daysLeft: number | null };

/**
 * Full-screen confirmation after a tap. The badge draws itself in, then the
 * heading, the stat tiles and the hint follow. It dismisses itself after a
 * few seconds (the bar at the bottom shows how long) or on any tap.
 */
export function KioskResult({
  result,
  seconds,
  pkg,
  onDismiss,
}: {
  result: KioskCheckInResult;
  seconds: number;
  pkg: KioskPackage | null;
  onDismiss: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const tone =
    result.status === "checked_in"
      ? "bg-brand-600 text-white"
      : result.status === "already"
        ? "bg-primary text-primary-foreground"
        : "bg-destructive text-white";

  // Everything under the badge rises into place once the badge has started
  // drawing, so the eye lands on the tick first and the details second.
  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
      if (prefersReducedMotion() || targets.length === 0) return;
      gsap.fromTo(
        targets,
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: MOTION.duration, ease: MOTION.ease, stagger: 0.08, delay: 0.55, clearProps: "transform,opacity,visibility" },
      );
    },
    { scope: ref, dependencies: [result] },
  );

  return (
    <button
      ref={ref}
      type="button"
      onClick={onDismiss}
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 p-8 text-center outline-none animate-in fade-in-0 duration-300",
        tone,
      )}
      aria-live="assertive"
    >
      <style href="kiosk-result" precedence="default">{`
        @keyframes kiosk-countdown { from { transform: scaleX(1); } to { transform: scaleX(0); } }
      `}</style>

      <ResultBadge kind={result.status === "checked_in" ? "done" : result.status === "already" ? "already" : "error"} />

      {result.status === "checked_in" ? (
        <>
          <h2 data-reveal className="font-heading text-5xl font-bold tracking-tight md:text-7xl">
            Welcome, {result.firstName}!
          </h2>
          <div className="flex flex-wrap items-stretch justify-center gap-3 md:gap-4">
            <StatTile icon={ClockIcon} value={result.time} label="Checked in" />
            <StatTile icon={CalendarCheckIcon} value={ordinal(result.visitsThisMonth)} label="Visit this month" />
            {pkg ? <StatTile icon={TicketIcon} value={packageValue(pkg.daysLeft)} label={`${pkg.name} package`} /> : null}
          </div>
          <p data-reveal className="text-base text-white/60">
            Enjoy your shake. Tap anywhere to continue.
          </p>
        </>
      ) : result.status === "already" ? (
        <>
          <h2 data-reveal className="font-heading text-5xl font-bold tracking-tight md:text-7xl">
            You&rsquo;re already in, {result.firstName}
          </h2>
          <div className="flex flex-wrap items-stretch justify-center gap-3 md:gap-4">
            <StatTile icon={ClockIcon} value={result.time} label="Checked in today" />
          </div>
          <p data-reveal className="text-base text-white/60">
            Nothing more to do. Coming back later today? Check in again then.
          </p>
        </>
      ) : (
        <>
          <h2 data-reveal className="font-heading text-4xl font-bold tracking-tight md:text-6xl">
            Something went wrong
          </h2>
          <p data-reveal className="max-w-xl text-2xl font-medium text-white/90">
            {result.message}
          </p>
          <p data-reveal className="text-base text-white/70">
            Please tell a staff member and they will mark you present.
          </p>
        </>
      )}

      <span data-reveal className="absolute bottom-10 opacity-80">
        <PixelMark className="h-16 md:h-20" />
      </span>

      <span className="absolute inset-x-0 bottom-0 h-1.5 origin-left bg-white/60" style={{ animation: `kiosk-countdown ${seconds}s linear forwards` }} />
    </button>
  );
}

/** One fact about the visit: an icon, the figure, and what the figure is. */
function StatTile({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <div data-reveal className="flex min-w-44 items-center gap-4 rounded-2xl bg-white/10 px-5 py-4 text-left ring-1 ring-white/15 ring-inset md:min-w-52 md:px-6">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/15">
        <Icon className="size-6" strokeWidth={2.25} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-heading text-2xl font-bold tracking-tight tabular-nums md:text-3xl">{value}</span>
        <span className="text-xs font-medium tracking-wide text-white/65 uppercase">{label}</span>
      </span>
    </div>
  );
}

function ordinal(n: number): string {
  const mod100 = n % 100;
  const suffix = mod100 >= 11 && mod100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${suffix}`;
}

function packageValue(daysLeft: number | null): string {
  if (daysLeft === null) return "Active";
  if (daysLeft === 0) return "Last day";
  return `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
}
