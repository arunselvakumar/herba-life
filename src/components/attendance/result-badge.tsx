"use client";

import { useRef } from "react";
import { AlertTriangleIcon, ClockIcon } from "lucide-react";
import { gsap, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";
import { cn } from "@/lib/utils";

export type ResultBadgeKind = "done" | "already" | "error";

/**
 * The big circle at the top of the kiosk result screen. For a successful
 * check-in the ring and the tick are drawn in with a pen stroke, then the
 * badge gives a small pop: the moment the member feels "done". The other
 * two states draw the ring and fade their icon in.
 *
 * Markup carries the finished state, so without JavaScript (or with reduced
 * motion) the badge is simply complete.
 */
export function ResultBadge({ kind, className }: { kind: ResultBadgeKind; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || prefersReducedMotion()) return;
      const ring = root.querySelector("[data-ring]");
      const stroke = root.querySelector("[data-stroke]");
      const icon = root.querySelector("[data-icon]");
      const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

      tl.fromTo(root, { scale: 0.85, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.35, ease: "power3.out" });
      if (ring) tl.fromTo(ring, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.55 }, "<0.05");
      if (stroke) tl.fromTo(stroke, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, ease: "power3.out" }, "-=0.2");
      if (icon) tl.fromTo(icon, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out(2)" }, "-=0.25");
      tl.to(root, { scale: 1.06, duration: 0.14, ease: "power2.out" }).to(root, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.5)" });
    },
    { scope: ref, dependencies: [kind] },
  );

  return (
    <span
      ref={ref}
      className={cn("relative flex size-32 items-center justify-center rounded-full bg-white/12 text-white md:size-40", className)}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" fill="none" className="absolute inset-0 size-full" overflow="visible">
        <circle cx="50" cy="50" r="48" stroke="currentColor" strokeOpacity="0.18" strokeWidth="3" />
        <circle
          data-ring
          cx="50"
          cy="50"
          r="48"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          transform="rotate(-90 50 50)"
        />
        {kind === "done" ? (
          <path
            data-stroke
            d="M29 52 L44 66 L72 36"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
          />
        ) : null}
      </svg>
      {kind === "already" ? (
        <ClockIcon data-icon className="relative size-16 md:size-20" strokeWidth={2.25} />
      ) : kind === "error" ? (
        <AlertTriangleIcon data-icon className="relative size-16 md:size-20" strokeWidth={2.25} />
      ) : null}
    </span>
  );
}
