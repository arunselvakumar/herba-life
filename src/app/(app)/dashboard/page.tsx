import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { CalendarDaysIcon, DownloadIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import {
  monthlySales,
  recentOrders,
  regionMix,
  stats,
  topDistributors,
} from "@/lib/dashboard-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { TopDistributors } from "@/components/dashboard/top-distributors";
import { RegionMix } from "@/components/dashboard/region-mix";

export const metadata: Metadata = {
  title: "Dashboard",
};

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

async function Greeting() {
  // The time-of-day greeting must be computed per request, never prerendered.
  await connection();
  const user = await getCurrentUser();
  const firstName = user.name.split(/\s+/)[0] ?? user.name;
  const greeting = greetingFor(new Date().getHours());

  return (
    <div className="space-y-1">
      <p className="text-eyebrow text-brand-600">Overview</p>
      <h1 className="font-heading text-3xl font-extrabold tracking-tight md:text-4xl">
        {greeting}, {firstName}.
      </h1>
      <p className="text-sm text-muted-foreground">
        Here is what is happening across Herbalife today.
      </p>
    </div>
  );
}

function GreetingSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-4 w-80" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <Suspense fallback={<GreetingSkeleton />}>
          <Greeting />
        </Suspense>
        <div className="flex gap-2">
          <Button variant="outline" size="lg">
            <CalendarDaysIcon data-icon="inline-start" />
            Oct 2026
          </Button>
          <Button size="lg">
            <DownloadIcon data-icon="inline-start" />
            Export report
          </Button>
        </div>
      </div>

      <section
        aria-label="Key metrics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesChart data={monthlySales} />
        </div>
        <RegionMix regions={regionMix} />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentOrders orders={recentOrders} />
        </div>
        <TopDistributors distributors={topDistributors} />
      </section>
    </>
  );
}
