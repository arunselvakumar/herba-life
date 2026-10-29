import Link from "next/link";
import { PencilIcon, Trash2Icon, UserRoundPlusIcon, UserRoundXIcon, UserRoundCheckIcon } from "lucide-react";
import { ConfirmAction } from "@/components/members/confirm-action";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteUser, setUserActive } from "@/lib/access/actions";
import type { UserRow } from "@/lib/access/queries";
import { formatDay, toDay } from "@/lib/members/dates";
import { initials } from "@/lib/members/format";
import { relativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";

export function UserTable({
  users,
  currentUserId,
  now,
  canCreate,
  canUpdate,
  canDelete,
}: {
  users: UserRow[];
  currentUserId: string;
  now: Date;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-foreground">
            <UserRoundPlusIcon className="size-6" />
          </span>
          <p className="font-semibold">No users yet</p>
          {canCreate ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/team/users/new">Add a user</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const showActions = canUpdate || canDelete;

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Last seen</TableHead>
            <TableHead className="hidden lg:table-cell">Added</TableHead>
            {showActions ? <TableHead className="w-32 pr-4 text-right">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const self = u.id === currentUserId;
            return (
              <TableRow key={u.id} className={cn(!u.isActive && "text-muted-foreground")}>
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <Avatar className={cn("size-9", !u.isActive && "opacity-60")}>
                      <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">{initials(u.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-semibold">
                        <span className="truncate">{u.name}</span>
                        {self ? (
                          <Badge variant="outline" className="rounded-full">
                            You
                          </Badge>
                        ) : null}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {u.role ? (
                    <Badge
                      className={cn(
                        "rounded-full border-transparent font-semibold",
                        u.role.isSystem ? "bg-primary text-primary-foreground" : "bg-brand-100 text-brand-700",
                      )}
                    >
                      {u.role.name}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-full text-muted-foreground">
                      No role
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {u.isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span aria-hidden className="size-2 rounded-full bg-success" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span aria-hidden className="size-2 rounded-full bg-border" />
                      Suspended
                    </span>
                  )}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {u.lastSeenAt ? relativeTime(u.lastSeenAt, now) : "Never signed in"}
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDay(toDay(u.createdAt))}</TableCell>
                {showActions ? (
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1">
                      {canUpdate ? (
                        <Button asChild variant="ghost" size="icon-sm" aria-label={`Edit ${u.name}`}>
                          <Link href={`/team/users/${u.id}/edit`}>
                            <PencilIcon />
                          </Link>
                        </Button>
                      ) : null}
                      {canUpdate && !self ? (
                        u.isActive ? (
                          <ConfirmAction
                            action={setUserActive.bind(null, u.id, false)}
                            title={`Suspend ${u.name}?`}
                            description="They are signed out everywhere and cannot sign in again until restored. Everything they recorded stays."
                            confirmLabel="Suspend"
                            destructive
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                          >
                            <UserRoundXIcon />
                            <span className="sr-only">Suspend</span>
                          </ConfirmAction>
                        ) : (
                          <ConfirmAction
                            action={setUserActive.bind(null, u.id, true)}
                            title={`Restore ${u.name}?`}
                            description="They can sign in again with their existing password."
                            confirmLabel="Restore"
                            variant="ghost"
                            size="icon-sm"
                          >
                            <UserRoundCheckIcon />
                            <span className="sr-only">Restore</span>
                          </ConfirmAction>
                        )
                      ) : null}
                      {canDelete && !self ? (
                        <ConfirmAction
                          action={deleteUser.bind(null, u.id)}
                          title={`Delete ${u.name}?`}
                          description="Removes the account permanently. Records they created stay, without their name attached. Prefer “Suspend” to keep the history."
                          confirmLabel="Delete user"
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
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
