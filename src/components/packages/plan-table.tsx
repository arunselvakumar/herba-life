import Link from "next/link";
import { ArchiveIcon, ArchiveRestoreIcon, PackageIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmAction } from "@/components/members/confirm-action";
import { formatMoney } from "@/lib/members/format";
import { deletePlan, setPlanActive } from "@/lib/packages/actions";
import type { PlanRow } from "@/lib/packages/queries";

export function PlanTable({ plans, canEdit }: { plans: PlanRow[]; canEdit: boolean }) {
  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-foreground">
            <PackageIcon className="size-6" />
          </span>
          <p className="font-semibold">No packages yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Packages are the programmes members enrol in, for example “3 months” for 90 days.
          </p>
          {canEdit ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/packages/new">Create the first package</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Package</TableHead>
            <TableHead className="text-right">Duration</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Members</TableHead>
            <TableHead>Status</TableHead>
            {canEdit ? <TableHead className="w-48 pr-4 text-right">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id} className={plan.isActive ? undefined : "text-muted-foreground"}>
              <TableCell className="pl-4">
                <div className="font-semibold">{plan.name}</div>
                {plan.description ? <div className="text-xs text-muted-foreground">{plan.description}</div> : null}
              </TableCell>
              <TableCell className="text-right tabular-nums">{plan.durationDays} days</TableCell>
              <TableCell className="text-right tabular-nums">{formatMoney(plan.price)}</TableCell>
              <TableCell className="hidden text-right tabular-nums sm:table-cell">
                {plan.activeEnrolments} active
                <span className="text-xs text-muted-foreground"> / {plan.enrolments} total</span>
              </TableCell>
              <TableCell>
                {plan.isActive ? (
                  <Badge className="rounded-full border-transparent bg-brand-100 font-semibold text-brand-700">Available</Badge>
                ) : (
                  <Badge variant="outline" className="rounded-full">Archived</Badge>
                )}
              </TableCell>
              {canEdit ? (
                <TableCell className="pr-4">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon-sm" aria-label={`Edit ${plan.name}`}>
                      <Link href={`/packages/${plan.id}/edit`}>
                        <PencilIcon />
                      </Link>
                    </Button>
                    {plan.isActive ? (
                      <ConfirmAction
                        action={setPlanActive.bind(null, plan.id, false)}
                        title={`Archive ${plan.name}?`}
                        description="Members already enrolled keep it. It just cannot be picked for new enrolments."
                        confirmLabel="Archive"
                        variant="ghost"
                        size="icon-sm"
                      >
                        <ArchiveIcon />
                        <span className="sr-only">Archive</span>
                      </ConfirmAction>
                    ) : (
                      <ConfirmAction
                        action={setPlanActive.bind(null, plan.id, true)}
                        title={`Make ${plan.name} available again?`}
                        confirmLabel="Restore"
                        variant="ghost"
                        size="icon-sm"
                      >
                        <ArchiveRestoreIcon />
                        <span className="sr-only">Restore</span>
                      </ConfirmAction>
                    )}
                    {plan.enrolments === 0 ? (
                      <ConfirmAction
                        action={deletePlan.bind(null, plan.id)}
                        title={`Delete ${plan.name}?`}
                        description="Nobody has been enrolled in it, so it can be removed permanently."
                        confirmLabel="Delete"
                        destructive
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground"
                      >
                        <Trash2Icon />
                        <span className="sr-only">Delete</span>
                      </ConfirmAction>
                    ) : null}
                  </div>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
