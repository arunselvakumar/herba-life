"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { MOTION, gsap, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";
import { horizontalLoop, type HorizontalLoop } from "@/components/motion/horizontal-loop";
import type { KioskMember } from "@/lib/attendance/queries";
import { fullName, initials } from "@/lib/members/format";
import { cn } from "@/lib/utils";

/**
 * Pastel tints for the member pills, picked per member number so the same
 * person is always the same colour. Each is pale enough for evergreen ink.
 */
const TINTS = ["#e5ffc5", "#f6d9d3", "#f7e7a1", "#d8e6f2", "#b5e3bd", "#ece4d3", "#e4dcf2", "#e7e5e0"];

/** Pills sit at staggered heights along the belt, like photos pinned to a wall. */
const LIFTS = [0, 44, 14, 30];

/** Pixels the belt drifts per second while nobody is touching it. */
const DRIFT_SPEED = 0.3;

/** Seconds of quiet before the belt starts drifting again. */
const DRIFT_RESUME_SECONDS = 2.5;

/**
 * The member list as an endless horizontal belt of tall pills. It drifts
 * slowly on its own, scrolls with a wheel or trackpad, and can be grabbed
 * and thrown on a touchscreen. When a search leaves only a handful of
 * members, they sit centred instead of looping.
 */
export function MemberRail({ members, onPick }: { members: KioskMember[]; onPick: (member: KioskMember) => void }) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const loop = useRef<HorizontalLoop | null>(null);
  const measured = useRef(0);
  const entered = useRef(false);
  const [looping, setLooping] = useState(false);
  const width = useResizeWidth(viewport, measured);

  useGSAP(
    () => {
      const vp = viewport.current;
      const el = track.current;
      if (!vp || !el) return;
      measured.current = Math.round(vp.clientWidth);
      const items = Array.from(el.children) as HTMLElement[];
      if (items.length === 0) return;
      const reduced = prefersReducedMotion();

      if (!entered.current) {
        entered.current = true;
        if (!reduced) {
          // On the items, not the pills: the pills transition `transform` in CSS
          // for hover, which would fight a GSAP tween of the same property.
          gsap.from(items, { autoAlpha: 0, y: 28, duration: MOTION.duration, ease: MOTION.ease, stagger: 0.04 });
        }
      }

      const last = items[items.length - 1];
      const beltWidth = last ? last.offsetLeft + last.offsetWidth : 0;
      if (beltWidth <= vp.clientWidth) {
        gsap.set(el, { justifyContent: "center" });
        loop.current = null;
        setLooping(false);
        return;
      }
      setLooping(true);

      let resume: gsap.core.Tween | null = null;
      const belt = horizontalLoop(items, {
        speed: DRIFT_SPEED,
        paddingRight: 24,
        draggable: true,
        paused: reduced,
        onInteract(phase) {
          resume?.kill();
          resume = null;
          if (phase === "end" && !reduced) {
            resume = gsap.delayedCall(DRIFT_RESUME_SECONDS, () => belt.timeline.play());
          }
        },
      });
      loop.current = belt;

      const onWheel = (event: WheelEvent) => {
        const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (!delta) return;
        event.preventDefault();
        belt.scrub(delta * (event.deltaMode === 1 ? 16 : 1));
      };
      vp.addEventListener("wheel", onWheel, { passive: false });

      return () => {
        vp.removeEventListener("wheel", onWheel);
        resume?.kill();
        belt.kill();
        loop.current = null;
      };
    },
    { scope: viewport, dependencies: [width, members], revertOnUpdate: true },
  );

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        ref={viewport}
        className="w-full cursor-grab touch-pan-y overflow-clip py-3 select-none active:cursor-grabbing [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]"
      >
        <ul ref={track} className="flex items-start gap-4 [--pill-w:clamp(9.5rem,21vw,12.5rem)] md:gap-5" aria-label="Members">
          {members.map((member, index) => (
            <li key={member.id} className="shrink-0" style={{ paddingTop: LIFTS[index % LIFTS.length] }}>
              <MemberPill member={member} onPick={() => onPick(member)} />
            </li>
          ))}
        </ul>
      </div>
      <p className={cn("flex items-center gap-3 text-sm text-muted-foreground", !looping && "invisible")}>
        <RailArrow label="Previous members" onClick={() => loop.current?.previous()}>
          <ArrowLeftIcon className="size-4" />
        </RailArrow>
        Scroll or drag to browse
        <RailArrow label="Next members" onClick={() => loop.current?.next()}>
          <ArrowRightIcon className="size-4" />
        </RailArrow>
      </p>
    </div>
  );
}

/**
 * One member as a tall capsule: name and number up top, and in place of the
 * photo we do not have, their initials set huge and cropped by the curve of
 * the pill, like a portrait peeking up from the bottom.
 */
function MemberPill({ member, onPick }: { member: KioskMember; onPick: () => void }) {
  const tint = TINTS[member.serialNo % TINTS.length];
  const name = fullName(member);
  return (
    <button
      type="button"
      onClick={onPick}
      style={{ backgroundColor: tint }}
      className="group relative flex h-[calc(var(--pill-w)*1.6)] w-(--pill-w) flex-col overflow-hidden rounded-full text-(--hl-evergreen) shadow-card transition-[transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-1.5 hover:shadow-float focus-visible:ring-4 focus-visible:ring-foreground/15 focus-visible:outline-none active:scale-[0.97] active:duration-150"
    >
      <span className="z-10 px-6 pt-9 text-center">
        <span className="line-clamp-2 font-heading text-[0.95rem] leading-tight font-bold tracking-[0.02em] uppercase">{name}</span>
        <span className="mt-1.5 block text-xs font-medium opacity-60">{member.packageName ? `${member.packageName} package` : "No active package"}</span>
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[62%] items-end justify-center overflow-hidden rounded-b-full bg-[radial-gradient(ellipse_at_50%_100%,rgb(14_37_18/0.12),transparent_70%)]"
      >
        <span className="font-heading translate-y-[0.18em] text-[calc(var(--pill-w)*0.58)] leading-none font-bold tracking-[-0.06em] text-(--hl-evergreen)/15 transition-transform duration-700 ease-out-expo group-hover:translate-y-[0.1em]">
          {initials(name)}
        </span>
      </span>
    </button>
  );
}

function RailArrow({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full border border-stone bg-card text-foreground shadow-sm transition hover:border-foreground/30 active:scale-95 focus-visible:ring-4 focus-visible:ring-foreground/10 focus-visible:outline-none"
    >
      {children}
    </button>
  );
}

/**
 * The viewport's width, updated after a resize. The first observation is
 * skipped when it matches what the belt already measured, so mounting does
 * not rebuild (and restart) the entrance animation.
 */
function useResizeWidth(ref: React.RefObject<HTMLElement | null>, measured: React.RefObject<number>): number {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const next = Math.round(entry.contentRect.width);
      if (next !== measured.current) setWidth(next);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, measured]);
  return width;
}
