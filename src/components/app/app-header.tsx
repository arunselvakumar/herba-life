import Link from "next/link";
import { Suspense } from "react";
import { PlusIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { HeaderTitle, HeaderTitleText } from "./header-title";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5" />
      <Suspense fallback={<HeaderTitleText title="Workspace" />}>
        <HeaderTitle />
      </Suspense>

      <div className="ml-auto flex items-center gap-2">
        <form action="/members" method="get" role="search" className="relative hidden md:block">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            placeholder="Search members by name, mobile or no."
            className="h-9 w-72 bg-card pl-8"
            aria-label="Search members"
          />
        </form>
        <Button asChild size="lg">
          <Link href="/members/new">
            <PlusIcon data-icon="inline-start" />
            New member
          </Link>
        </Button>
      </div>
    </header>
  );
}
