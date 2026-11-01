"use client";

import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { gsap } from "./gsap";

gsap.registerPlugin(Draggable, InertiaPlugin);

export type HorizontalLoopConfig = {
  /** Belt speed when playing, in hundreds of pixels per second. */
  speed?: number;
  /** Extra room after the last item before the first comes round again. */
  paddingRight?: number;
  /** Start paused; call `timeline.play()` to drift. */
  paused?: boolean;
  /** Grab and throw with a pointer or finger. */
  draggable?: boolean;
  /** Fires when a drag, wheel or arrow nudge starts and when it settles. */
  onInteract?: (phase: "start" | "end") => void;
};

export type HorizontalLoop = {
  timeline: gsap.core.Timeline;
  /** Nudge the belt by a number of pixels; positive moves it on (items travel left). */
  scrub: (pixels: number) => void;
  next: () => void;
  previous: () => void;
  kill: () => void;
};

/**
 * Turns a row of siblings into a seamless, infinitely repeating belt: each
 * item slides left and, once it has cleared the start, reappears after the
 * last one. Adapted from GSAP's `horizontalLoop` helper.
 *
 * The belt must be wider than its container, or there would be a gap on
 * the wrap. Pixel widths are read once, so rebuild it after a resize.
 */
export function horizontalLoop(items: HTMLElement[], config: HorizontalLoopConfig = {}): HorizontalLoop {
  const length = items.length;
  const first = items[0];
  const lastItem = items[length - 1];
  if (!first || !lastItem) throw new Error("horizontalLoop needs at least one item");
  const container = first.parentElement as HTMLElement;
  const pixelsPerSecond = (config.speed ?? 1) * 100;
  const snap = gsap.utils.snap(1);
  const interact = config.onInteract ?? (() => {});
  const startX = first.offsetLeft;
  const at = (values: number[], i: number) => values[i] ?? 0;
  const times: number[] = [];
  const widths: number[] = [];
  const spaceBefore: number[] = [];
  const xPercents: number[] = [];
  let totalWidth = 0;
  let curIndex = 0;
  let indexIsDirty = false;
  let timeWrap = (t: number) => t;

  const tl = gsap.timeline({
    repeat: -1,
    paused: config.paused ?? false,
    defaults: { ease: "none" },
    onReverseComplete: () => {
      tl.totalTime(tl.rawTime() + tl.duration() * 100);
    },
  });

  const scaleX = (el: HTMLElement) => Number(gsap.getProperty(el, "scaleX"));
  const px = (el: HTMLElement, prop: string) => parseFloat(String(gsap.getProperty(el, prop, "px")));

  const getTotalWidth = () => {
    return (
      lastItem.offsetLeft +
      (at(xPercents, length - 1) / 100) * at(widths, length - 1) -
      startX +
      at(spaceBefore, 0) +
      lastItem.offsetWidth * scaleX(lastItem) +
      (config.paddingRight ?? 0)
    );
  };

  const populateWidths = () => {
    let previous = container.getBoundingClientRect();
    items.forEach((el, i) => {
      const width = px(el, "width");
      widths[i] = width;
      xPercents[i] = snap((px(el, "x") / width) * 100 + Number(gsap.getProperty(el, "xPercent")));
      const box = el.getBoundingClientRect();
      spaceBefore[i] = box.left - (i ? previous.right : previous.left);
      previous = box;
    });
    gsap.set(items, { xPercent: (i) => at(xPercents, i) });
    totalWidth = getTotalWidth();
  };

  const populateTimeline = () => {
    tl.clear();
    for (let i = 0; i < length; i++) {
      const item = items[i];
      if (!item) continue;
      const width = at(widths, i);
      const curX = (at(xPercents, i) / 100) * width;
      const distanceToStart = item.offsetLeft + curX - startX + at(spaceBefore, 0);
      const distanceToLoop = distanceToStart + width * scaleX(item);
      tl.to(
        item,
        {
          xPercent: snap(((curX - distanceToLoop) / width) * 100),
          duration: distanceToLoop / pixelsPerSecond,
        },
        0,
      )
        .fromTo(
          item,
          {
            xPercent: snap(((curX - distanceToLoop + totalWidth) / width) * 100),
          },
          {
            xPercent: at(xPercents, i),
            duration: (totalWidth - distanceToLoop) / pixelsPerSecond,
            immediateRender: false,
          },
          distanceToLoop / pixelsPerSecond,
        )
        .add("label" + i, distanceToStart / pixelsPerSecond);
      times[i] = distanceToStart / pixelsPerSecond;
    }
    timeWrap = gsap.utils.wrap(0, tl.duration());
  };

  const getClosest = (values: number[], value: number, wrap: number) => {
    let i = values.length;
    let closest = 1e10;
    let index = 0;
    while (i--) {
      let d = Math.abs(at(values, i) - value);
      if (d > wrap / 2) d = wrap - d;
      if (d < closest) {
        closest = d;
        index = i;
      }
    }
    return index;
  };

  const closestIndex = (setCurrent: boolean) => {
    const index = getClosest(times, tl.time(), tl.duration());
    if (setCurrent) {
      curIndex = index;
      indexIsDirty = false;
    }
    return index;
  };
  const current = () => (indexIsDirty ? closestIndex(true) : curIndex);

  let proxy: HTMLDivElement | null = null;

  const toIndex = (index: number) => {
    if (Math.abs(index - curIndex) > length / 2) index += index > curIndex ? -length : length;
    const newIndex = gsap.utils.wrap(0, length, index);
    let time = at(times, newIndex);
    if (time > tl.time() !== index > curIndex && index !== curIndex) {
      time += tl.duration() * (index > curIndex ? 1 : -1);
    }
    curIndex = newIndex;
    if (proxy) gsap.killTweensOf(proxy);
    interact("start");
    tl.tweenTo(time, {
      duration: 0.6,
      ease: "power3.inOut",
      overwrite: true,
      ...(time < 0 || time > tl.duration() ? { modifiers: { time: timeWrap } } : {}),
      onComplete: () => interact("end"),
    });
  };

  // Wheel nudges accumulate into one target so a fast scroll does not stall
  // behind the previous nudge's ease.
  let scrubTarget: number | null = null;
  const scrub = (pixels: number) => {
    if (proxy) gsap.killTweensOf(proxy);
    interact("start");
    tl.pause();
    scrubTarget = (scrubTarget ?? tl.totalTime()) + pixels / pixelsPerSecond;
    gsap.to(tl, {
      totalTime: scrubTarget,
      duration: 0.5,
      ease: "power3.out",
      overwrite: true,
      onComplete: () => {
        scrubTarget = null;
        indexIsDirty = true;
        interact("end");
      },
    });
  };

  gsap.set(items, { x: 0 });
  populateWidths();
  populateTimeline();
  tl.progress(1, true).progress(0, true);
  // Sit well inside the repeat so dragging backwards never hits time zero.
  tl.totalTime(tl.duration() * 50, true);

  let draggable: Draggable | null = null;
  if (config.draggable) {
    proxy = document.createElement("div");
    const wrap = gsap.utils.wrap(0, 1);
    let ratio = 0;
    let startProgress = 0;
    let lastSnap = 0;
    let initChangeX = 0;
    const align = () => tl.progress(wrap(startProgress + (draggable!.startX - draggable!.x) * ratio));

    draggable =
      Draggable.create(proxy, {
        trigger: container,
        type: "x",
        inertia: true,
        overshootTolerance: 0,
        onPressInit() {
          const x = this.x as number;
          gsap.killTweensOf(tl);
          scrubTarget = null;
          interact("start");
          tl.pause();
          startProgress = tl.progress();
          ratio = 1 / totalWidth;
          initChangeX = startProgress / -ratio - x;
          gsap.set(proxy, { x: startProgress / -ratio });
        },
        onDrag: align,
        onThrowUpdate: align,
        snap(value: number) {
          if (Math.abs(startProgress / -ratio - this.x) < 10) return lastSnap + initChangeX;
          const time = -(value * ratio) * tl.duration();
          const wrappedTime = timeWrap(time);
          const snapTime = at(times, getClosest(times, wrappedTime, tl.duration()));
          let dif = snapTime - wrappedTime;
          if (Math.abs(dif) > tl.duration() / 2) dif += dif < 0 ? tl.duration() : -tl.duration();
          lastSnap = (time + dif) / tl.duration() / -ratio;
          return lastSnap;
        },
        onRelease() {
          closestIndex(true);
          if (draggable!.isThrowing) indexIsDirty = true;
          else interact("end");
        },
        onThrowComplete() {
          closestIndex(true);
          interact("end");
        },
      })[0] ?? null;
  }

  closestIndex(true);

  return {
    timeline: tl,
    scrub,
    next: () => toIndex(current() + 1),
    previous: () => toIndex(current() - 1),
    kill: () => {
      draggable?.kill();
      gsap.killTweensOf(tl);
      tl.kill();
    },
  };
}
