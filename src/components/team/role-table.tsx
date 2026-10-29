import Link from "next/link";
import { EyeIcon, LockIcon, PencilIcon, ShieldPlusIcon, Trash2Icon } from "lucide-react";
import { ConfirmAction } from "@/components/members/confirm-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteRole } from "@/lib/access/actions";
import { ALL_PERMISSIONS } from "@/lib/access/permissions";
import type { RoleRow } from "@/lib/access/queries";
import { PermissionCoverage } from "./permission-coverage";

export function RoleTable({
  roles,
  canCreate,
  canUpdate,
  canDelete,
}: {
  roles: RoleRow[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  if (roles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-foreground">
            <ShieldPlusIcon className="size-6" />
          </span>
          <p className="font-semibold">No roles yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">A role is a named set of permissions, for example “Front desk”.</p>
          {canCreate ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/team/roles/new">Create the first role</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const total = ALL_PERMISSIONS.length;
  const showActions = canUpdate || canDelete;

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Role</TableHead>
            <TableHead className="hidden lg:table-cell">Permissions</TableHead>
            <TableHead className="text-right">Allowed</TableHead>
            <TableHead className="text-right">Users</TableHead>
            {showActions ? <TableHead className="w-28 pr-4 text-right">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell className="pl-4 align-top">
                <div className="flex items-center gap-2 font-semibold">
                  {role.name}
                  {role.isSystem ? (
                    <Badge className="rounded-full border-transparent bg-primary font-semibold text-primary-foreground">
                      <LockIcon data-icon="inline-start" />
                      Built in
                    </Badge>
                  ) : null}
                </div>
                {role.description ? <div className="max-w-md text-xs whitespace-normal text-muted-foreground">{role.description}</div> : null}
                <PermissionCoverage permissions={role.permissions} className="mt-2 lg:hidden" />
              </TableCell>
              <TableCell className="hidden align-top whitespace-normal lg:table-cell">
                <PermissionCoverage permissions={role.permissions} />
              </TableCell>
              <TableCell className="text-right align-top tabular-nums">
                <span className="font-semibold">{role.permissions.length}</span>
                <span className="text-xs text-muted-foreground"> / {total}</span>
              </TableCell>
              <TableCell className="text-right align-top tabular-nums">{role.userCount}</TableCell>
              {showActions ? (
                <TableCell className="pr-4 align-top">
                  <div className="flex justify-end gap-1">
                    {canUpdate ? (
                      <Button asChild variant="ghost" size="icon-sm" aria-label={role.isSystem ? `View ${role.name}` : `Edit ${role.name}`}>
                        <Link href={`/team/roles/${role.id}/edit`}>{role.isSystem ? <EyeIcon /> : <PencilIcon />}</Link>
                      </Button>
                    ) : null}
                    {canDelete && !role.isSystem ? (
                      role.userCount === 0 ? (
                        <ConfirmAction
                          action={deleteRole.bind(null, role.id)}
                          title={`Delete ${role.name}?`}
                          description="Nobody holds this role, so it can be removed permanently."
                          confirmLabel="Delete"
                          destructive
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground"
                        >
                          <Trash2Icon />
                          <span className="sr-only">Delete</span>
                        </ConfirmAction>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled
                          className="text-muted-foreground"
                          title={`Move the ${role.userCount} user${role.userCount === 1 ? "" : "s"} on this role elsewhere before deleting it`}
                        >
                          <Trash2Icon />
                          <span className="sr-only">Delete (in use)</span>
                        </Button>
                      )
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
