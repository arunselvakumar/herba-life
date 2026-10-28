import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { SearchIcon, UserRoundPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberTable } from "@/components/members/member-table";
import { PageHeader } from "@/components/members/field";
import { today } from "@/lib/members/dates";
import { listMembers, type MemberFilter } from "@/lib/members/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Members",
};

const FILTERS: readonly { value: MemberFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "On a package" },
  { value: "due", label: "Follow-up due" },
  { value: "expiring", label: "Ending soon" },
  { value: "no-package", label: "No package" },
];

function isFilter(value: unknown): value is MemberFilter {
  return FILTERS.some((f) => f.value === value);
}

export default function MembersPage(props: PageProps<"/members">) {
  return (
    <>
      <PageHeader
        title="Members"
        description="Everyone enrolled at this branch, with their current package and last follow-up."
        actions={
          <Button asChild size="lg">
            <Link href="/members/new">
              <UserRoundPlusIcon data-icon="inline-start" />
              New member
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <MemberList searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function MemberList({ searchParams }: { searchParams: PageProps<"/members">["searchParams"] }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const filter: MemberFilter = isFilter(params.filter) ? params.filter : "all";
  await connection();
  const members = await listMembers({ q, filter, today: today() });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Filter members" className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {FILTERS.map((f) => {
            const href = { pathname: "/members", query: { ...(q ? { q } : {}), ...(f.value === "all" ? {} : { filter: f.value }) } };
            const active = f.value === filter;
            return (
              <Link
                key={f.value}
                href={href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition",
                  active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                {f.label}
              </Link>
            );
          })}
        </nav>
        <form action="/members" method="get" role="search" className="relative md:w-80">
          {filter !== "all" ? <input type="hidden" name="filter" value={filter} /> : null}
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Name, mobile, email or no."
            className="h-9 bg-card pl-8"
            aria-label="Search members"
          />
        </form>
      </div>

      <p className="text-xs text-muted-foreground">
        {members.length} member{members.length === 1 ? "" : "s"}
        {q ? ` matching “${q}”` : ""}
      </p>

      <MemberTable
        members={members}
        emptyMessage={q ? "No members match that search." : filter === "all" ? "No members yet." : "No members in this group."}
      />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-xl" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}
