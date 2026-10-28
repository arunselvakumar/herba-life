"use client";

import { usePathname } from "next/navigation";
import { findNavItem } from "./nav-config";

/** Reads the URL, so it must render inside a `<Suspense>` boundary. */
export function HeaderTitle() {
  const pathname = usePathname();
  return <HeaderTitleText title={findNavItem(pathname)?.title ?? "Workspace"} />;
}

export function HeaderTitleText({ title }: { title: string }) {
  return (
    <div className="flex min-w-0 flex-col leading-tight">
      <span className="text-eyebrow text-[0.6rem] text-muted-foreground">Herbalife Internal</span>
      <span className="truncate text-sm font-semibold">{title}</span>
    </div>
  );
}
