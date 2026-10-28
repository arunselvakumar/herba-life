"use client";

import { AlertTriangleIcon, CheckIcon, ClockIcon } from "lucide-react";
import type { KioskCheckInResult } from "@/lib/attendance/actions";
import { cn } from "@/lib/utils";

/**
 * Full-screen confirmation after a tap. It dismisses itself after a few
 * seconds (the bar at the bottom shows how long) or on any tap.
 */
export function KioskResult({
  result,
  seconds,
  packageLine,
  onDismiss,
}: {
  result: KioskCheckInResult;
  seconds: number;
  packageLine: string | null;
  onDismiss: () => void;
}) {
  const tone =
    result.status === "checked_in"
      ? "bg-brand-600 text-white"
      : result.status === "already"
        ? "bg-primary text-primary-foreground"
        : "bg-destructive text-white";

  return (
    <button
      type="button"
      onClick={onDismiss}
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-8 text-center outline-none animate-in fade-in-0 duration-300",
        tone,
      )}
      aria-live="assertive"
    >
      <style href="kiosk-result" precedence="default">{`
        @keyframes kiosk-countdown { from { transform: scaleX(1); } to { transform: scaleX(0); } }
      `}</style>

      <span className="flex size-32 items-center justify-center rounded-full bg-white/15 ring-8 ring-white/10 animate-in zoom-in-50 duration-500 md:size-40">
        {result.status === "checked_in" ? (
          <CheckIcon className="size-20 md:size-24" strokeWidth={2.5} />
        ) : result.status === "already" ? (
          <ClockIcon className="size-20 md:size-24" strokeWidth={2.25} />
        ) : (
          <AlertTriangleIcon className="size-20 md:size-24" strokeWidth={2.25} />
        )}
      </span>

      {result.status === "checked_in" ? (
        <>
          <h2 className="font-heading text-5xl font-bold tracking-tight md:text-7xl">Welcome, {result.firstName}!</h2>
          <p className="text-2xl font-medium text-white/90 md:text-3xl">
            Checked in at {result.time}
            <span className="mx-3 text-white/50">·</span>
            Visit {result.visitsThisMonth} this month
          </p>
          {packageLine ? <p className="text-lg text-white/75 md:text-xl">{packageLine}</p> : null}
          <p className="mt-2 text-base text-white/60">Enjoy your shake. Tap anywhere to continue.</p>
        </>
      ) : result.status === "already" ? (
        <>
          <h2 className="font-heading text-5xl font-bold tracking-tight md:text-7xl">You&rsquo;re already in, {result.firstName}</h2>
          <p className="text-2xl font-medium text-white/90 md:text-3xl">Checked in at {result.time} today. Nothing more to do.</p>
          <p className="mt-2 text-base text-white/60">Coming back later today? Check in again then.</p>
        </>
      ) : (
        <>
          <h2 className="font-heading text-4xl font-bold tracking-tight md:text-6xl">Something went wrong</h2>
          <p className="max-w-xl text-2xl font-medium text-white/90">{result.message}</p>
          <p className="mt-2 text-base text-white/70">Please tell a staff member and they will mark you present.</p>
        </>
      )}

      <span className="absolute inset-x-0 bottom-0 h-1.5 origin-left bg-white/60" style={{ animation: `kiosk-countdown ${seconds}s linear forwards` }} />
    </button>
  );
}
