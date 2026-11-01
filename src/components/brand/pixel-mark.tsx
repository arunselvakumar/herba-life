"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";
import { cn } from "@/lib/utils";
import { PixelArt, type PixelPalette } from "./pixel-art";

/**
 * The Herbalife leaf mark redrawn as pixel art, with a shake beside it: the
 * kiosk's little mascot. It breathes (a slow float) and the bubbles beside
 * the straw drift up, both gentle enough to sit under a message without
 * competing with it.
 *
 * Painted in `currentColor`, so it takes the colour of its surroundings:
 * white on the green welcome screen, Evergreen on a light card.
 *
 * Legend: L leaf · V leaf vein · S straw · T lid · C cup · M shake · s bubble
 */
const ROWS = [
  "................LL..............",
  "..............LLLL..............",
  "............LLLLLL............S.",
  "LLLL.......LLVLLLL.....s.....S..",
  "LLLLLL.....LLVLLL.....s.....S...",
  ".LLLLLL...LLVLLLL.......s..S....",
  ".LLVLLLL..LLLLLL...........S....",
  "..LLVLLL..LLLLL......TTTTTTTTTT.",
  "..LLLVLLL.LLLL.......CMMMMMMMMC.",
  "...LLLLLL.LLL..LLL...CMMMMMMMMC.",
  "....LLLLLL.L.LLLLL...CMMMMMMMMC.",
  ".....LLLLL...LLLLL...CMMMMMMMMC.",
  ".......LLL.LLLLLLL...CMMMMMMMMC.",
  "...........LLVLLLL...CMMMMMMMMC.",
  "..........LLLVLLL.....CMMMMMMC..",
  "..........LLVLLLL.....CMMMMMMC..",
  "..........LLLLLL......CMMMMMMC..",
  "..........LLLLL.......CMMMMMMC..",
  "..........LLLL........CMMMMMMC..",
  "...........L...........CCCCCC...",
] as const;

const PALETTE: PixelPalette = {
  L: { fill: "currentColor" },
  V: { fill: "currentColor", opacity: 0.55 },
  S: { fill: "currentColor", opacity: 0.7 },
  T: { fill: "currentColor", opacity: 0.85 },
  C: { fill: "currentColor", opacity: 0.8 },
  M: { fill: "currentColor", opacity: 0.3 },
  s: { fill: "currentColor", opacity: 0.4 },
};

export function PixelMark({ className, animated = true }: { className?: string; animated?: boolean }) {
  const ref = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !animated || prefersReducedMotion()) return;

      // A slow breath for the whole mark.
      gsap.to(el, { y: -3, duration: 2.6, ease: "sine.inOut", repeat: -1, yoyo: true });

      // Bubbles rise and fade, one after another.
      const steam = Array.from(el.querySelectorAll<SVGRectElement>('[data-px="s"]'));
      gsap.fromTo(
        steam,
        { opacity: 0, y: 1 },
        { opacity: 1, y: -1, duration: 1.4, ease: "sine.inOut", repeat: -1, yoyo: true, stagger: { each: 0.45, repeat: -1, yoyo: true } },
      );
    },
    { scope: ref, dependencies: [animated] },
  );

  return <PixelArt ref={ref} rows={ROWS} palette={PALETTE} aria-hidden className={cn("h-16 w-auto", className)} />;
}
