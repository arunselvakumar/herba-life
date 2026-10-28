"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/** House easing and timing, so every animation in the console feels related. */
export const MOTION = {
  ease: "expo.out",
  duration: 0.8,
  stagger: 0.06,
} as const;

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, useGSAP };
