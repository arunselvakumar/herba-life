"use client";

import { useRef } from "react";
import { MOTION, gsap, prefersReducedMotion, useGSAP } from "./gsap";

const formatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/**
 * Rolls a number up from zero when it first appears. Renders the final value
 * on the server, so the figure is correct without JavaScript and in tests.
 */
export function CountUp({ value, className, duration = 1.2 }: { value: number; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !Number.isFinite(value) || value === 0) return;
    const state = { n: 0 };
    el.textContent = formatter.format(0);
    gsap.to(state, {
      n: value,
      duration,
      ease: MOTION.ease,
      onUpdate: () => {
        el.textContent = formatter.format(Math.round(state.n));
      },
      onComplete: () => {
        el.textContent = formatter.format(value);
      },
    });
  }, [value]);

  return (
    <span ref={ref} className={className} suppressHydrationWarning>
      {formatter.format(value)}
    </span>
  );
}
