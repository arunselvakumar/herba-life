"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { MOTION, gsap, prefersReducedMotion, useGSAP } from "./gsap";

/**
 * A slim progress track whose fill grows from the left on mount. `value` is a
 * fraction from 0 to 1; it is clamped so bad data never overflows the track.
 */
export function GrowBar({
  value,
  tone = "ink",
  className,
  label,
}: {
  value: number;
  tone?: "ink" | "leaf" | undefined;
  className?: string | undefined;
  label?: string | undefined;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pct = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)) * 100;

  useGSAP(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: MOTION.duration + 0.4, ease: MOTION.ease, delay: 0.15 });
  }, [pct]);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        ref={ref}
        className={cn("h-full origin-left rounded-full", tone === "ink" ? "bg-foreground" : "bg-accent-strong")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
