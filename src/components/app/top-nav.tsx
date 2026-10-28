"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { gsap, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";
import { findNavItem, navigation } from "./nav-config";

const noop = () => () => {};
/** False during server render and hydration, true after; no state updates needed. */
function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/**
 * Pill navigation. One ink-black pill marks the current module and glides to
 * the next one on navigation. Before hydration the active link paints its
 * own pill, so the first frame is already correct.
 *
 * Reads the URL, so it must render inside a `<Suspense>` boundary.
 */
export function TopNav({ className, testId }: { className?: string; testId?: string }) {
  const pathname = usePathname();
  const activeHref = findNavItem(pathname)?.href ?? null;
  const hydrated = useHydrated();
  const listRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const first = useRef(true);

  useGSAP(
    () => {
      const list = listRef.current;
      const pill = pillRef.current;
      if (!list || !pill) return;

      const place = (animate: boolean) => {
        const target = list.querySelector<HTMLElement>('[data-active="true"]');
        if (!target) {
          gsap.set(pill, { autoAlpha: 0 });
          return;
        }
        const vars = { x: target.offsetLeft, width: target.offsetWidth, autoAlpha: 1 };
        if (!animate || prefersReducedMotion()) {
          gsap.set(pill, vars);
        } else {
          gsap.to(pill, { ...vars, duration: 0.6, ease: "expo.out", overwrite: "auto" });
        }
        target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: animate ? "smooth" : "instant" });
      };

      place(!first.current);
      first.current = false;

      const observer = new ResizeObserver(() => place(false));
      observer.observe(list);
      return () => observer.disconnect();
    },
    { scope: listRef, dependencies: [activeHref, hydrated] },
  );

  return (
    <nav aria-label="Primary" data-testid={testId} className={cn("min-w-0", className)}>
      <div
        ref={listRef}
        className="relative flex items-center gap-1 overflow-x-auto rounded-full bg-card/70 p-1 ring-1 ring-border/80 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <span
          ref={pillRef}
          aria-hidden
          className="pointer-events-none absolute top-1 bottom-1 left-0 rounded-full bg-primary opacity-0 shadow-[0_10px_24px_-12px_rgb(17_17_17/0.6)]"
        />
        {navigation.map((item) => {
          const active = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={active}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative z-10 flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-300 outline-none focus-visible:ring-3 focus-visible:ring-ring/15",
                active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                active && !hydrated && "bg-primary",
              )}
            >
              <item.icon className="size-4 opacity-80" />
              {item.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Static fallback for Suspense: same pills, nothing highlighted. */
export function TopNavSkeleton({ className }: { className?: string }) {
  return (
    <nav aria-label="Primary" className={cn("min-w-0", className)}>
      <div className="flex items-center gap-1 overflow-x-auto rounded-full bg-card/70 p-1 ring-1 ring-border/80 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navigation.map((item) => (
          <span key={item.href} className="flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap text-muted-foreground">
            <item.icon className="size-4 opacity-80" />
            {item.title}
          </span>
        ))}
      </div>
    </nav>
  );
}
