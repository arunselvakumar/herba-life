"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, prefersReducedMotion, useGSAP } from "./gsap";

/**
 * The page name repeated behind the heading as a huge, faint watermark. It
 * drifts in from the left as the page appears; the surrounding header handles
 * the fade, so the two never stack. Decorative only: hidden from
 * assistive technology and never selectable.
 */
export function GhostTitle({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    gsap.fromTo(el, { x: -24 }, { x: 0, duration: 1.6, ease: "expo.out", clearProps: "transform" });
  }, [text]);

  return (
    <span
      ref={ref}
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-1/2 left-0 z-0 -translate-y-1/2 font-heading text-[5rem] leading-[1.12] font-semibold tracking-[-0.05em] whitespace-nowrap text-foreground/[0.045] select-none md:text-[8.5rem]",
        className,
      )}
    >
      {text}
    </span>
  );
}
