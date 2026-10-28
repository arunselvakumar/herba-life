import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Kiosk } from "@/components/attendance/kiosk";
import { Skeleton } from "@/components/ui/skeleton";
import { countDay, listKioskMembers } from "@/lib/attendance/queries";
import { today } from "@/lib/members/dates";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Attendance Mode",
};

export default function KioskPage() {
  return (
    <Suspense fallback={<KioskSkeleton />}>
      <KioskLoader />
    </Suspense>
  );
}

async function KioskLoader() {
  await connection();
  const now = today();
  const [user, members, counts] = await Promise.all([getCurrentUser(), listKioskMembers(now), countDay(now)]);
  return <Kiosk members={members} today={now} initialTodayVisits={counts.visits} staffName={user.name} />;
}

function KioskSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="h-20 bg-foreground" />
      <div className="mx-auto w-full max-w-5xl flex-1 space-y-6 p-6">
        <Skeleton className="mx-auto h-8 w-72" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
