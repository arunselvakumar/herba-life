import Link from "next/link";
import { CalendarClockIcon, PackagePlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { MemberPackage } from "@/db/schema";
import { deletePackage, setPackageStatus } from "@/lib/members/actions";
import { EXPIRING_SOON_DAYS } from "@/lib/members/constants";
import { daysBetween, formatDay } from "@/lib/members/dates";
import { daysLeft, formatMoney, packageState } from "@/lib/members/format";
import { ConfirmAction } from "./confirm-action";
import { PackageBadge } from "./package-badge";

export function PackageList({ memberId, packages, today }: { memberId: string; packages: MemberPackage[]; today: string }) {
  return (
    <Card className="ring-stone/80">
      <CardHeader>
        <CardTitle className="text-base font-bold">Packages</CardTitle>
        <CardDescription>Programmes the member has enrolled in</CardDescription>
        <CardAction>
          <Button asChild size="sm">
            <Link href={`/members/${memberId}/packages/new`}>
              <PackagePlusIcon data-icon="inline-start" />
              New package
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {packages.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            No package yet. Create one to start tracking the programme.
          </p>
        ) : (
          packages.map((pkg) => <PackageItem key={pkg.id} memberId={memberId} pkg={pkg} today={today} />)
        )}
      </CardContent>
    </Card>
  );
}

function PackageItem({ memberId, pkg, today }: { memberId: string; pkg: MemberPackage; today: string }) {
  const state = packageState(pkg, EXPIRING_SOON_DAYS, today);
  const total = pkg.durationDays + pkg.extraDays;
  const elapsed = Math.min(Math.max(daysBetween(pkg.startDate, today) + 1, 0), total);
  const left = daysLeft(pkg, today);
  const balance = pkg.price !== null ? Math.max(pkg.price - pkg.amountPaid, 0) : null;
  const isOpen = pkg.status === "active";

  return (
    <div className="space-y-3 rounded-lg border bg-linen/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold">{pkg.name}</p>
            <PackageBadge state={state} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDay(pkg.startDate)} → {formatDay(pkg.endDate)} · {pkg.durationDays} days
            {pkg.extraDays > 0 ? ` + ${pkg.extraDays} extra` : ""}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold tabular-nums">{formatMoney(pkg.price)}</p>
          <p className="text-xs text-muted-foreground">
            Paid {formatMoney(pkg.amountPaid)}
            {balance !== null && balance > 0 ? <span className="text-amber-700"> · Due {formatMoney(balance)}</span> : null}
          </p>
        </div>
      </div>

      {isOpen && state !== "upcoming" ? (
        <div className="space-y-1">
          <Progress value={(elapsed / total) * 100} className="h-1.5" />
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClockIcon className="size-3" />
            {left < 0 ? `Ended ${-left} days ago` : left === 0 ? "Last day today" : `${left} days left`} · day {elapsed} of {total}
          </p>
        </div>
      ) : null}

      {pkg.notes ? <p className="text-sm text-muted-foreground">{pkg.notes}</p> : null}

      <div className="flex flex-wrap gap-2">
        {isOpen ? (
          <>
            <ConfirmAction
              action={setPackageStatus.bind(null, memberId, pkg.id, "completed")}
              title="Mark package as completed?"
              description="The member finished this programme. You can still create a new package afterwards."
              confirmLabel="Mark completed"
            >
              Mark completed
            </ConfirmAction>
            <ConfirmAction
              action={setPackageStatus.bind(null, memberId, pkg.id, "cancelled")}
              title="Cancel this package?"
              description="The package stays on record but no longer counts as active."
              confirmLabel="Cancel package"
              destructive
            >
              Cancel
            </ConfirmAction>
          </>
        ) : (
          <ConfirmAction
            action={setPackageStatus.bind(null, memberId, pkg.id, "active")}
            title="Reopen this package?"
            confirmLabel="Reopen"
          >
            Reopen
          </ConfirmAction>
        )}
        <ConfirmAction
          action={deletePackage.bind(null, memberId, pkg.id)}
          title="Delete this package?"
          description="This removes the package record permanently."
          confirmLabel="Delete"
          destructive
          variant="ghost"
          className="ml-auto text-muted-foreground"
        >
          <Trash2Icon />
          Delete
        </ConfirmAction>
      </div>
    </div>
  );
}
