import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { MessageSquarePlusIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { NoAccess } from "@/components/app/no-access";
import { InquiryTable } from "@/components/inquiries/inquiry-table";
import { PageHeader, PageHeaderSkeleton } from "@/components/members/field";
import { can } from "@/lib/access/can";
import { listInquiries, type InquiryFilter } from "@/lib/inquiries/queries";
import { today } from "@/lib/members/dates";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Enquiries",
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
    <Suspense
      fallback={
        <>
          <PageHeaderSkeleton />
          <ListSkeleton />
        </>
      }
    >
      <Inquiries searchParams={props.searchParams} />
    </Suspense>
  );
}

/** Checks the role first so the header's buttons match what the person may do. */
async function Inquiries({ searchParams }: { searchParams: PageProps<"/inquiries">["searchParams"] }) {
  const user = await getCurrentUser();
  if (!can(user, "inquiries.view")) return <NoAccess permission="inquiries.view" />;
  const canCreate = can(user, "inquiries.create");

  return (
    <>
      <PageHeader
        eyebrow="Enquiries"
        title="Enquiries"
        description="People who asked about the programme but have not joined yet. Keep following up until they do."
        actions={
          canCreate ? (
            <Button asChild size="lg">
              <Link href="/inquiries/new">
                <MessageSquarePlusIcon data-icon="inline-start" />
                New enquiry
              </Link>
            </Button>
          ) : undefined
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <InquiryList searchParams={searchParams} canCreate={canCreate} />
      </Suspense>
    </>
  );
}

async function InquiryList({
  searchParams,
  canCreate,
}: {
  searchParams: PageProps<"/inquiries">["searchParams"];
  canCreate: boolean;
}) {
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
        <nav aria-label="Filter enquiries" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const href = { pathname: "/inquiries", query: { ...(q ? { q } : {}), filter: f.value } };
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
        <form action="/inquiries" method="get" role="search" className="relative md:w-80">
          <input type="hidden" name="filter" value={filter} />
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Name, mobile, email or no."
            className="h-11 pl-11"
            aria-label="Search enquiries"
          />
        </form>
      </div>

      <p className="text-xs text-muted-foreground">
        {inquiries.length} enquir{inquiries.length === 1 ? "y" : "ies"}
        {q ? ` matching “${q}”` : ""}
      </p>

      <InquiryTable
        inquiries={inquiries}
        today={now}
        canCreate={canCreate}
        emptyMessage={
          q ? "No enquiries match that search." : filter === "all" ? "No enquiries yet." : filter === "due" ? "Nothing due. Nice." : "No enquiries in this group."
        }
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
