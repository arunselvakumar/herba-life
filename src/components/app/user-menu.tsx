"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronDownIcon, LoaderCircleIcon, LogOutIcon, ShieldCheckIcon, ShieldUserIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { CurrentUser } from "@/lib/session";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserMenu({ user, canManageTeam }: { user: CurrentUser; canManageTeam: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await authClient.signOut();
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="user-menu-trigger"
          aria-label={`Account: ${user.name}`}
          className="flex h-11 items-center gap-2 rounded-full bg-card p-1 pr-3 text-left ring-1 ring-border transition-[box-shadow,background-color] duration-200 outline-none hover:ring-foreground/30 focus-visible:ring-3 focus-visible:ring-ring/15 data-[state=open]:ring-foreground/30"
        >
          <Avatar className="size-9">
            {user.image ? <AvatarImage src={user.image} alt="" /> : null}
            <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate text-sm font-semibold lg:block">{user.name.split(/\s+/)[0]}</span>
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" sideOffset={10}>
        <DropdownMenuLabel className="flex items-center gap-3 p-2 font-normal">
          <Avatar className="size-10">
            <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled>
            <ShieldCheckIcon />
            {user.roleName ? `Role: ${user.roleName}` : "No role assigned"}
          </DropdownMenuItem>
          {canManageTeam ? (
            <DropdownMenuItem asChild>
              <Link href="/team">
                <ShieldUserIcon />
                Users &amp; roles
              </Link>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut} disabled={isPending}>
          {isPending ? <LoaderCircleIcon className="animate-spin" /> : <LogOutIcon />}
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
