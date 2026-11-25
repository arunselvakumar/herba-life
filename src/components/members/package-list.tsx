import Link from "next/link";
import { PackagePlusIcon, TicketIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { MemberPackage } from "@/db/schema";
import { deletePackage, setPackageStatus } from "@/lib/members/actions";
import { LOW_VISITS_THRESHOLD } from "@/lib/members/constants";
import { formatDay } from "@/lib/members/dates";
import { describeVisitsLeft, formatMoney, packageState, visitsLeft, visitsTotal } from "@/lib/members/format";
import { ConfirmAction } from "./confirm-action";
import { PackageBadge } from "./package-badge";

export function PackageList({
  memberId,
  packages,
  today,
  canManage,
}: {
  memberId: string;
  packages: MemberPackage[];
  today: string;
  /** Shows "New package" and the complete / cancel / reopen / delete actions (members.packages). */
  canManage?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-bold">Packages</CardTitle>
        <CardDescription>Programmes the member has enrolled in</CardDescription>
        {canManage ? (
          <CardAction>
            <Button asChild size="sm">
              <Link href={`/members/${memberId}/packages/new`}>
                <PackagePlusIcon data-icon="inline-start" />
                New package
              </Link>
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {packages.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            {canManage ? "No package yet. Create one to start tracking the programme." : "No package yet."}
          </p>
        ) : (
          packages.map((pkg) => <PackageItem key={pkg.id} memberId={memberId} pkg={pkg} today={today} canManage={canManage ?? false} />)
        )}
      </CardContent>
    </Card>
  );
}

function PackageItem({
  memberId,
  pkg,
  today,
  canManage,
}: {
  memberId: string;
  pkg: MemberPackage;
  today: string;
  canManage: boolean;
}) {
  const state = packageState(pkg, LOW_VISITS_THRESHOLD, today);
  const total = visitsTotal(pkg);
  const left = visitsLeft(pkg);
  const balance = pkg.price !== null ? Math.max(pkg.price - pkg.amountPaid, 0) : null;
  const isOpen = pkg.status === "active";

  return (
    <div className="space-y-3 rounded-2xl border bg-muted/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold">{pkg.name}</p>
            <PackageBadge state={state} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {state === "upcoming" ? "Starts" : "Started"} {formatDay(pkg.startDate)} · {pkg.visits} visits
            {pkg.extraVisits > 0 ? ` + ${pkg.extraVisits} extra` : ""}
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

      {state !== "upcoming" ? (
        <div className="space-y-1">
          {isOpen ? <Progress value={total > 0 ? (pkg.visitsUsed / total) * 100 : 0} className="h-1.5" /> : null}
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <TicketIcon className="size-3" />
            {pkg.visitsUsed} of {total} visits used
            {isOpen ? ` · ${describeVisitsLeft(left).toLowerCase()}` : left > 0 ? ` · ${left} not used` : ""}
          </p>
        </div>
      ) : null}

      {pkg.notes ? <p className="text-sm text-muted-foreground">{pkg.notes}</p> : null}

      {canManage ? (
        <div className="flex flex-wrap gap-2">
          {isOpen ? (
            <>
              <ConfirmAction
                action={setPackageStatus.bind(null, memberId, pkg.id, "completed")}
                title="Mark package as completed?"
                description="This closes the package. Any visits left on it can no longer be used, unless you reopen it. You can still create a new package afterwards."
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
      ) : null}
    </div>
  );
}
