import Link from "next/link";
import { Suspense } from "react";
import { PlusIcon, SearchIcon } from "lucide-react";
import { AttendanceModeButton } from "@/components/attendance/attendance-mode-button";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HeaderUser, HeaderUserSkeleton } from "./header-user";
import { TopNav, TopNavSkeleton } from "./top-nav";

/**
 * The admin shell's only chrome: brand on the left, the module pills in the
 * middle, search and the account on the right. On narrow screens the pills
 * drop to a second, horizontally scrolling row.
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-18 w-full max-w-[1440px] items-center gap-4 px-4 md:px-8">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-3 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/15"
          aria-label="Herbalife, go to dashboard"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-card shadow-card ring-1 ring-border">
            <LogoMark className="h-5" title="" />
          </span>
          <span className="hidden flex-col leading-none md:flex">
            <span className="text-[1.05rem] font-bold tracking-[-0.02em]">Herbalife</span>
            <span className="mt-1 text-[0.7rem] font-medium text-muted-foreground">Internal</span>
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 justify-center lg:flex">
          <Suspense fallback={<TopNavSkeleton />}>
            <TopNav testId="app-nav" />
          </Suspense>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <form action="/members" method="get" role="search" className="relative hidden xl:block">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              placeholder="Search members"
              className="h-11 w-64 pl-11"
              aria-label="Search members"
            />
          </form>
          <AttendanceModeButton variant="outline" size="lg" className="hidden md:inline-flex" />
          <AttendanceModeButton variant="outline" size="icon-lg" className="md:hidden" aria-label="Attendance Mode">
            <span className="sr-only">Attendance Mode</span>
          </AttendanceModeButton>
          <Button asChild size="lg" className="hidden sm:inline-flex">
            <Link href="/members/new">
              <PlusIcon data-icon="inline-start" />
              New member
            </Link>
          </Button>
          <Button asChild size="icon-lg" className="sm:hidden" aria-label="New member">
            <Link href="/members/new">
              <PlusIcon />
            </Link>
          </Button>
          <Suspense fallback={<HeaderUserSkeleton />}>
            <HeaderUser />
          </Suspense>
        </div>
      </div>

      <div className="px-4 pb-3 md:px-8 lg:hidden">
        <Suspense fallback={<TopNavSkeleton />}>
          <TopNav testId="app-nav-compact" />
        </Suspense>
      </div>
    </header>
  );
}
