"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/components/motion/gsap";

/*
 * Constellation grid background. Adapted from Daiwiik Harihar's Constellation
 * Grid (https://21st.dev/@daiwiikharihar/components/constellation-grid).
 *
 * A square mesh of small dots joined to their neighbours by hairlines. Each
 * dot hangs on a spring at its rest position; the pointer pushes nearby dots
 * away, harder the faster it moves, and the mesh springs back once it passes.
 * Dots near the pointer pick up the leaf green.
 *
 * Changes from the original: tuned well down for a working console (fainter
 * dots and lines, a gentler push, no radar rings or coordinate labels),
 * colours from the console palette, time-based physics, neighbour links
 * instead of an all-pairs distance check, and rendering stops once the mesh
 * has settled, so an idle page costs nothing. The pointer is ignored over
 * anything that paints a background (cards, header, buttons), so only bare
 * canvas reacts. Reduced motion keeps the green highlight but never moves
 * the dots.
 */

export type BackgroundConstellationGridProps = {
  className?: string;
  /** Field color behind the mesh. */
  backgroundColor?: string;
  /** Dot and line color at rest. */
  inkColor?: string;
  /** Color dots and lines take near the pointer. */
  accentColor?: string;
  /** Distance between dots, in CSS pixels. */
  spacing?: number;
  /** Dot opacity at rest, from 0 to 1. */
  dotOpacity?: number;
  /** Line opacity at rest, from 0 to 1. */
  lineOpacity?: number;
  /** Reach of the pointer, in CSS pixels. */
  radius?: number;
  /** Push strength multiplier. Use 0 to keep the dots still. */
  force?: number;
};

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  size: number;
  /** Pointer proximity, eased, from 0 to 1. */
  heat: number;
};

const SPRING = 18;
// Velocity kept per 60 Hz frame; applied as a power of elapsed time.
const FRICTION = 0.82;

function rgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function mix(a: [number, number, number], b: [number, number, number], t: number) {
  return `${Math.round(a[0] + (b[0] - a[0]) * t)}, ${Math.round(a[1] + (b[1] - a[1]) * t)}, ${Math.round(a[2] + (b[2] - a[2]) * t)}`;
}

type SceneOptions = Required<Omit<BackgroundConstellationGridProps, "className">> & { still: boolean };

function createScene(canvas: HTMLCanvasElement, container: HTMLDivElement, options: SceneOptions) {
  const { backgroundColor, inkColor, accentColor, spacing, dotOpacity, lineOpacity, radius, force, still } = options;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return { update: () => {}, dispose: () => {} };

  const ink = rgb(inkColor);
  const accent = rgb(accentColor);

  let width = 0;
  let height = 0;
  let columns = 0;
  let rows = 0;
  let nodes: Node[] = [];

  const build = () => {
    // One spare ring of dots past every edge, so a push never opens a gap at the border.
    columns = Math.ceil(width / spacing) + 3;
    rows = Math.ceil(height / spacing) + 3;
    const startX = (width - (columns - 1) * spacing) / 2;
    const startY = (height - (rows - 1) * spacing) / 2;
    nodes = [];
    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < rows; j++) {
        const x = startX + i * spacing;
        const y = startY + j * spacing;
        nodes.push({ x, y, vx: 0, vy: 0, baseX: x, baseY: y, size: 0.9 + Math.random() * 0.5, heat: 0 });
      }
    }
  };

  let awake = true;
  const resize = () => {
    width = container.clientWidth;
    height = container.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    build();
    awake = true;
  };

  const pointer = { x: -1e4, y: -1e4, lastX: -1e4, lastY: -1e4, speed: 0 };
  let present = false;

  // The pointer counts as "over content" when the element under it, or any
  // ancestor up to the grid's parent, paints a background: cards, the header,
  // buttons, pills. Transparent wrappers and bare text still count as canvas.
  // Checked only when the element under the pointer changes.
  const root = container.parentElement;
  let lastHit: Element | null = null;
  let lastHitCovered = false;
  const overContent = (el: Element | null) => {
    if (el === lastHit) return lastHitCovered;
    lastHit = el;
    lastHitCovered = false;
    for (let node = el; node && node !== root && node !== document.body; node = node.parentElement) {
      if (node === container) break;
      const style = getComputedStyle(node);
      if (
        (style.backgroundColor !== "rgba(0, 0, 0, 0)" && style.backgroundColor !== "transparent") ||
        (style.backdropFilter && style.backdropFilter !== "none")
      ) {
        lastHitCovered = true;
        break;
      }
    }
    return lastHitCovered;
  };

  // Listen on window so content placed above the canvas does not block the pointer.
  const onPointerMove = (e: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    const hit = e.target instanceof Element ? e.target : null;
    if (overContent(hit)) {
      present = false;
      awake = true;
      return;
    }
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (!present) {
      // Re-entering the canvas should not register as one long, fast sweep.
      pointer.lastX = x;
      pointer.lastY = y;
    }
    pointer.x = x;
    pointer.y = y;
    present = true;
    awake = true;
  };
  const onPointerLeave = () => {
    present = false;
    awake = true;
  };

  const draw = () => {
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);
    context.lineWidth = 0.7;

    // Links to the right and below; each fades as it stretches and warms near the pointer.
    const link = (a: Node, b: Node) => {
      const length = Math.hypot(a.x - b.x, a.y - b.y);
      const stretch = Math.max(0, 1 - Math.max(0, length - spacing) / (spacing * 0.8));
      const heat = (a.heat + b.heat) / 2;
      const alpha = lineOpacity * stretch * (1 + heat * 1.5);
      if (alpha < 0.004) return;
      context.strokeStyle = `rgba(${mix(ink, accent, heat)}, ${alpha})`;
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.stroke();
    };
    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < rows; j++) {
        const node = nodes[i * rows + j]!;
        if (i + 1 < columns) link(node, nodes[(i + 1) * rows + j]!);
        if (j + 1 < rows) link(node, nodes[i * rows + j + 1]!);
      }
    }

    for (const node of nodes) {
      const alpha = dotOpacity + (0.45 - dotOpacity) * node.heat;
      context.fillStyle = `rgba(${mix(ink, accent, node.heat)}, ${alpha})`;
      context.beginPath();
      context.arc(node.x, node.y, node.size * (1 + node.heat * 0.5), 0, Math.PI * 2);
      context.fill();
    }
  };

  const update = (delta: number) => {
    if (!awake || delta <= 0) return;

    const moved = Math.hypot(pointer.x - pointer.lastX, pointer.y - pointer.lastY);
    // Pixels per millisecond, smoothed so one jumpy frame does not fling the mesh.
    pointer.speed += (Math.min(moved / (delta * 1000), 4) - pointer.speed) * 0.3;
    pointer.lastX = pointer.x;
    pointer.lastY = pointer.y;

    const keep = FRICTION ** (delta * 60);
    // A resting pointer holds a shallow dimple (about a quarter of a cell); sweeps push further.
    const push = still ? 0 : (250 + pointer.speed * 120) * force;
    let energy = 0;
    for (const node of nodes) {
      const dx = pointer.x - node.x;
      const dy = pointer.y - node.y;
      const distance = Math.hypot(dx, dy);
      const reach = present && distance < radius ? 1 - distance / radius : 0;
      if (reach > 0 && distance > 0) {
        node.vx -= (dx / distance) * reach * push * delta;
        node.vy -= (dy / distance) * reach * push * delta;
      }
      node.vx = (node.vx + (node.baseX - node.x) * SPRING * delta) * keep;
      node.vy = (node.vy + (node.baseY - node.y) * SPRING * delta) * keep;
      node.x += node.vx * delta * 60;
      node.y += node.vy * delta * 60;

      // Light up quickly, cool down slowly.
      const target = reach * reach * (3 - 2 * reach);
      node.heat += (target - node.heat) * (target > node.heat ? 0.25 : 0.06);

      // Displacement is left out: a resting pointer holds dots off their rest spot indefinitely.
      energy = Math.max(energy, Math.abs(node.vx), Math.abs(node.vy), Math.abs(target - node.heat) * 10);
    }
    draw();

    // Stop rendering once the mesh has settled and the pointer is still; the next move wakes it.
    if (energy < 0.005 && pointer.speed < 0.001) {
      if (!present) {
        for (const node of nodes) {
          node.x = node.baseX;
          node.y = node.baseY;
          node.vx = 0;
          node.vy = 0;
          node.heat = 0;
        }
        draw();
      }
      awake = false;
    }
  };

  const observer = new ResizeObserver(() => {
    resize();
    draw();
  });
  observer.observe(container);
  window.addEventListener("pointermove", onPointerMove);
  document.documentElement.addEventListener("pointerleave", onPointerLeave);

  const dispose = () => {
    observer.disconnect();
    window.removeEventListener("pointermove", onPointerMove);
    document.documentElement.removeEventListener("pointerleave", onPointerLeave);
  };

  return { update, dispose };
}

/**
 * Fills its nearest positioned ancestor (`absolute inset-0`), so render it
 * inside a `relative` container and place content above it.
 *
 * Colour: the field is the console's canvas grey and the mesh is graphite at
 * low opacity, so cards and text keep the surface they always had and the
 * grid reads as texture rather than pattern. Near the pointer it warms to the
 * leaf green used for progress and the second chart series.
 */
export function BackgroundConstellationGrid({
  className,
  backgroundColor = "#efeeec",
  inkColor = "#6b6b68",
  accentColor = "#42a046",
  spacing = 56,
  dotOpacity = 0.22,
  lineOpacity = 0.07,
  radius = 180,
  force = 1,
}: BackgroundConstellationGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const { update, dispose } = createScene(canvas, container, {
      backgroundColor,
      inkColor,
      accentColor,
      spacing,
      dotOpacity,
      lineOpacity,
      radius,
      force,
      still: prefersReducedMotion(),
    });

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      update(Math.min((now - last) / 1000, 0.05));
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      dispose();
    };
  }, [backgroundColor, inkColor, accentColor, spacing, dotOpacity, lineOpacity, radius, force]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{ backgroundColor }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
