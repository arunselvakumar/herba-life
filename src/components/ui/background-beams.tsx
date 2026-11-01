"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/components/motion/gsap";

/*
 * Beams background. Adapted from Kokonut UI
 * (https://21st.dev/@kokonutd/components/beams-background).
 *
 * Soft diagonal shafts of light drift upward through a dark field, each one
 * pulsing gently. The beams are drawn on a 2D canvas at a fraction of the
 * screen resolution and blurred with CSS, so they stay cheap: a heavy blur
 * hides the low resolution completely.
 *
 * Changes from the original: the hues come from the console's leaf greens
 * instead of blue and violet, motion is time-based rather than per frame, and
 * reduced motion paints one still frame.
 */

const RENDER_SCALE = 0.5;

export type BackgroundBeamsProps = {
  className?: string;
  /** Field color behind the beams. */
  backgroundColor?: string;
  /** Number of beams on screen. */
  beams?: number;
  /** Lowest and highest hue a beam may take, in degrees. */
  hueRange?: readonly [number, number];
  /** Overall beam brightness, from 0 to 1. */
  intensity?: number;
  /** Blur radius, in CSS pixels. */
  blur?: number;
  /** Speed multiplier for the upward drift. */
  speed?: number;
};

type Beam = {
  x: number;
  y: number;
  width: number;
  length: number;
  angle: number;
  speed: number;
  opacity: number;
  hue: number;
  pulse: number;
  pulseSpeed: number;
};

function createBeam(width: number, height: number, hueRange: readonly [number, number]): Beam {
  return {
    x: Math.random() * width * 1.5 - width * 0.25,
    y: Math.random() * height * 1.5 - height * 0.25,
    width: 30 + Math.random() * 60,
    length: height * 2.5,
    angle: -35 + Math.random() * 10,
    // Pixels per second, in render space.
    speed: 18 + Math.random() * 36,
    opacity: 0.12 + Math.random() * 0.16,
    hue: hueRange[0] + Math.random() * (hueRange[1] - hueRange[0]),
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 1.2 + Math.random() * 1.8,
  };
}

/** Sends a beam that has left the top back below the field, in its own column so they stay spread out. */
function resetBeam(beam: Beam, index: number, total: number, width: number, height: number, hueRange: readonly [number, number]) {
  const column = index % 3;
  const spacing = width / 3;
  beam.y = height + 100;
  beam.x = column * spacing + spacing / 2 + (Math.random() - 0.5) * spacing * 0.5;
  beam.width = 100 + Math.random() * 100;
  beam.speed = 15 + Math.random() * 24;
  beam.hue = hueRange[0] + ((hueRange[1] - hueRange[0]) * index) / total;
  beam.opacity = 0.2 + Math.random() * 0.1;
}

function drawBeam(ctx: CanvasRenderingContext2D, beam: Beam, intensity: number) {
  ctx.save();
  ctx.translate(beam.x, beam.y);
  ctx.rotate((beam.angle * Math.PI) / 180);

  const alpha = beam.opacity * (0.8 + Math.sin(beam.pulse) * 0.2) * intensity;
  const gradient = ctx.createLinearGradient(0, 0, 0, beam.length);
  const color = (a: number) => `hsla(${beam.hue}, 70%, 60%, ${a})`;
  gradient.addColorStop(0, color(0));
  gradient.addColorStop(0.1, color(alpha * 0.5));
  gradient.addColorStop(0.4, color(alpha));
  gradient.addColorStop(0.6, color(alpha));
  gradient.addColorStop(0.9, color(alpha * 0.5));
  gradient.addColorStop(1, color(0));

  ctx.fillStyle = gradient;
  ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
  ctx.restore();
}

/**
 * Fills its nearest positioned ancestor (`absolute inset-0`), so render it
 * inside a `relative` container and place content above it.
 */
export function BackgroundBeams({
  className,
  backgroundColor = "#111111",
  beams: count = 24,
  hueRange = [95, 155],
  intensity = 0.85,
  blur = 35,
  speed = 1,
}: BackgroundBeamsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hueLow, hueHigh] = hueRange;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !container || !ctx) return;

    const hues = [hueLow, hueHigh] as const;
    let width = 0;
    let height = 0;
    let beams: Beam[] = [];

    const resize = () => {
      width = Math.max(1, Math.round(container.clientWidth * RENDER_SCALE));
      height = Math.max(1, Math.round(container.clientHeight * RENDER_SCALE));
      canvas.width = width;
      canvas.height = height;
      beams = Array.from({ length: count }, () => createBeam(width, height, hues));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const beam of beams) drawBeam(ctx, beam, intensity);
    };

    const still = prefersReducedMotion();
    const observer = new ResizeObserver(() => {
      resize();
      draw();
    });
    observer.observe(container);
    if (still) return () => observer.disconnect();

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.1);
      last = now;
      beams.forEach((beam, index) => {
        beam.y -= beam.speed * speed * delta;
        beam.pulse += beam.pulseSpeed * delta;
        if (beam.y + beam.length < -100) resetBeam(beam, index, beams.length, width, height, hues);
      });
      draw();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [count, hueLow, hueHigh, intensity, speed]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{ backgroundColor }}
    >
      {/* Oversized so the blur never fades out at the panel edges. */}
      <canvas
        ref={canvasRef}
        className="absolute -inset-[10%] h-[120%] w-[120%]"
        style={{ filter: `blur(${blur}px)` }}
      />
    </div>
  );
}
