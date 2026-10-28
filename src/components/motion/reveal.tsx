"use client";

import { useRef, type ComponentProps } from "react";
import { MOTION, gsap, prefersReducedMotion, useGSAP } from "./gsap";

/**
 * Fades and lifts its `[data-reveal]` descendants into place when the block
 * mounts, one after another. Pages stream in behind Suspense boundaries, so a
 * mount-time animation lands exactly when the real content arrives.
 *
 * Without any `[data-reveal]` children the wrapper itself is animated.
 */
export function Reveal({
  stagger = MOTION.stagger,
  delay = 0,
  y = 16,
  children,
  ...props
}: ComponentProps<"div"> & { stagger?: number; delay?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const found = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
      const candidates = found.length > 0 ? found : [root];
      // Anything the CSS safety fallback has already shown (slow hydration on a
      // hard load) is left alone, so it never blinks back to invisible.
      const targets = candidates.filter((el) => !el.hasAttribute("data-reveal") || getComputedStyle(el).opacity === "0");
      for (const el of candidates) el.setAttribute("data-revealed", "");
      if (prefersReducedMotion() || targets.length === 0) return;
      gsap.fromTo(
        targets,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          duration: MOTION.duration,
          ease: MOTION.ease,
          stagger,
          delay,
          clearProps: "transform,opacity,visibility",
        },
      );
    },
    { scope: ref },
  );

  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
}
