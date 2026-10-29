import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { SearchIcon, UserRoundPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { NoAccess } from "@/components/app/no-access";
import { MemberTable } from "@/components/members/member-table";
import { PageHeader, PageHeaderSkeleton } from "@/components/members/field";
import { can } from "@/lib/access/can";
import { today } from "@/lib/members/dates";
import { listMembers, type MemberFilter } from "@/lib/members/queries";
import { getCurrentUser } from "@/lib/session";
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
    <Suspense
      fallback={
        <>
          <PageHeaderSkeleton />
          <ListSkeleton />
        </>
      }
    >
      <Members searchParams={props.searchParams} />
    </Suspense>
  );
}

/** Checks the role first so the header's buttons match what the person may do. */
async function Members({ searchParams }: { searchParams: PageProps<"/members">["searchParams"] }) {
  const user = await getCurrentUser();
  if (!can(user, "members.view")) return <NoAccess permission="members.view" />;
  const canCreate = can(user, "members.create");

  return (
    <>
      <PageHeader
        title="Members"
        description="Everyone enrolled at this branch, with their current package and last follow-up."
        actions={
          canCreate ? (
            <Button asChild size="lg">
              <Link href="/members/new">
                <UserRoundPlusIcon data-icon="inline-start" />
                New member
              </Link>
            </Button>
          ) : undefined
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <MemberList searchParams={searchParams} canCreate={canCreate} />
      </Suspense>
    </>
  );
}

async function MemberList({
  searchParams,
  canCreate,
}: {
  searchParams: PageProps<"/members">["searchParams"];
  canCreate: boolean;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const filter: MemberFilter = isFilter(params.filter) ? params.filter : "all";
  await connection();
  const members = await listMembers({ q, filter, today: today() });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Filter members" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const href = { pathname: "/members", query: { ...(q ? { q } : {}), ...(f.value === "all" ? {} : { filter: f.value }) } };
            const active = f.value === filter;
            return (
              <Link
                key={f.value}
                href={href}
                className={cn(
                  "inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold ring-1 transition-[background-color,color,box-shadow] duration-200",
                  active ? "bg-primary text-primary-foreground ring-primary" : "bg-card text-muted-foreground ring-border hover:text-foreground hover:ring-foreground/30",
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
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Name, mobile, email or no."
            className="h-11 pl-11"
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
        canCreate={canCreate}
        emptyMessage={q ? "No members match that search." : filter === "all" ? "No members yet." : "No members in this group."}
      />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-xl" />
      <Skeleton className="h-72 w-full rounded-3xl" />
    </div>
  );
}
