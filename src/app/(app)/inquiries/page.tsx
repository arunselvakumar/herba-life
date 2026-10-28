import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { MessageSquarePlusIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { InquiryTable } from "@/components/inquiries/inquiry-table";
import { PageHeader } from "@/components/members/field";
import { listInquiries, type InquiryFilter } from "@/lib/inquiries/queries";
import { today } from "@/lib/members/dates";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Inquiries",
};

const FILTERS: readonly { value: InquiryFilter; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "due", label: "Follow-up due" },
  { value: "new", label: "New" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
  { value: "all", label: "All" },
];

function isFilter(value: unknown): value is InquiryFilter {
  return FILTERS.some((f) => f.value === value);
}

export default function InquiriesPage(props: PageProps<"/inquiries">) {
  return (
    <>
      <PageHeader
        eyebrow="Inquiries"
        title="Inquiries"
        description="People who asked about the programme but have not joined yet. Keep following up until they do."
        actions={
          <Button asChild size="lg">
            <Link href="/inquiries/new">
              <MessageSquarePlusIcon data-icon="inline-start" />
              New inquiry
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <InquiryList searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function InquiryList({ searchParams }: { searchParams: PageProps<"/inquiries">["searchParams"] }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  // A search runs across everything unless a filter was chosen explicitly.
  const filter: InquiryFilter = isFilter(params.filter) ? params.filter : q ? "all" : "open";
  await connection();
  const now = today();
  const inquiries = await listInquiries({ q, filter, today: now });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Filter inquiries" className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {FILTERS.map((f) => {
            const href = { pathname: "/inquiries", query: { ...(q ? { q } : {}), filter: f.value } };
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
        <form action="/inquiries" method="get" role="search" className="relative md:w-80">
          <input type="hidden" name="filter" value={filter} />
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Name, mobile, email or no."
            className="h-9 bg-card pl-8"
            aria-label="Search inquiries"
          />
        </form>
      </div>

      <p className="text-xs text-muted-foreground">
        {inquiries.length} inquir{inquiries.length === 1 ? "y" : "ies"}
        {q ? ` matching “${q}”` : ""}
      </p>

      <InquiryTable
        inquiries={inquiries}
        today={now}
        emptyMessage={
          q ? "No inquiries match that search." : filter === "all" ? "No inquiries yet." : filter === "due" ? "Nothing due. Nice." : "No inquiries in this group."
        }
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
