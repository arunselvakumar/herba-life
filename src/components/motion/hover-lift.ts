"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "./gsap";

/**
 * Gives every `[data-lift]` element under the returned ref a gentle rise on
 * hover. Used for cards that link somewhere, so they feel pressable.
 */
export function useHoverLift() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || prefersReducedMotion()) return;
      const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-lift]"));
      const cleanups = cards.map((card) => {
        const up = () => gsap.to(card, { y: -3, duration: 0.35, ease: "power3.out", overwrite: "auto" });
        const down = () => gsap.to(card, { y: 0, duration: 0.45, ease: "power3.out", overwrite: "auto" });
        card.addEventListener("pointerenter", up);
        card.addEventListener("pointerleave", down);
        return () => {
          card.removeEventListener("pointerenter", up);
          card.removeEventListener("pointerleave", down);
        };
      });
      return () => cleanups.forEach((fn) => fn());
    },
    { scope: ref },
  );

  return ref;
}
