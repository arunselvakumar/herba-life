import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { NoAccess } from "@/components/app/no-access";
import { Kiosk } from "@/components/attendance/kiosk";
import { Skeleton } from "@/components/ui/skeleton";
import { can } from "@/lib/access/can";
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
  const user = await getCurrentUser();
  // The kiosk has no shell, so the card gets its own padding.
  if (!can(user, "attendance.kiosk")) return <NoAccess permission="attendance.kiosk" className="m-auto w-full max-w-lg" />;
  await connection();
  const now = today();
  const [members, counts] = await Promise.all([listKioskMembers(now), countDay(now)]);
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
