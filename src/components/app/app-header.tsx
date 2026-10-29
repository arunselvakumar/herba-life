import Link from "next/link";
import { Suspense } from "react";
import { PlusIcon } from "lucide-react";
import { AttendanceModeButton } from "@/components/attendance/attendance-mode-button";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { HeaderActions, HeaderNav, HeaderUser, HeaderUserSkeleton } from "./header-user";
import { TopNavSkeleton } from "./top-nav";

/**
 * The admin shell's only chrome: brand on the left, the module pills in the
 * middle, the two quick actions and the account on the right. Pills and
 * actions are limited to what the signed-in user's role allows.
 *
 * Widths are budgeted so the pill row never has to scroll on a laptop or
 * desktop: below `xl` the pills drop to a full-width second row; between `xl`
 * and `2xl` the brand wordmark steps aside and Attendance Mode is icon-only.
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-18 w-full max-w-[1440px] items-center gap-4 px-4 md:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/15"
          aria-label="Herbalife, go to the overview"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-card shadow-card ring-1 ring-border">
            <LogoMark className="h-5" title="" />
          </span>
          <span className="hidden flex-col leading-none md:flex xl:hidden 2xl:flex">
            <span className="text-[1.05rem] font-bold tracking-[-0.02em]">Herbalife</span>
            <span className="mt-1 text-[0.7rem] font-medium text-muted-foreground">Internal</span>
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 justify-center xl:flex">
          <Suspense fallback={<TopNavSkeleton />}>
            <HeaderNav testId="app-nav" />
          </Suspense>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Suspense fallback={<HeaderActionsSkeleton />}>
            <HeaderActions>
              {({ kiosk, newMember }) => (
                <>
                  {kiosk ? (
                    <>
                      <AttendanceModeButton variant="outline" size="lg" className="hidden 2xl:inline-flex" />
                      <AttendanceModeButton variant="outline" size="icon-lg" className="2xl:hidden" aria-label="Attendance Mode" title="Attendance Mode">
                        <span className="sr-only">Attendance Mode</span>
                      </AttendanceModeButton>
                    </>
                  ) : null}
                  {newMember ? (
                    <>
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
                    </>
                  ) : null}
                </>
              )}
            </HeaderActions>
          </Suspense>
          <Suspense fallback={<HeaderUserSkeleton />}>
            <HeaderUser />
          </Suspense>
        </div>
      </div>

      <div className="px-4 pb-3 md:px-8 xl:hidden">
        <Suspense fallback={<TopNavSkeleton />}>
          <HeaderNav testId="app-nav-compact" />
        </Suspense>
      </div>
    </header>
  );
}

function HeaderActionsSkeleton() {
  return (
    <>
      <div className="size-11 rounded-full bg-card ring-1 ring-border 2xl:hidden" />
      <div className="hidden h-11 w-40 rounded-full bg-card ring-1 ring-border 2xl:block" />
      <div className="hidden h-11 w-36 rounded-full bg-primary/10 sm:block" />
    </>
  );
}
