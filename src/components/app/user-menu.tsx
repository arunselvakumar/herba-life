"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  ChevronsUpDownIcon,
  LoaderCircleIcon,
  LogOutIcon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react";
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
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserMenu({ user }: { user: CurrentUser }) {
  const router = useRouter();
  const { isMobile } = useSidebar();
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
        <SidebarMenuButton
          size="lg"
          data-testid="user-menu-trigger"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Avatar className="size-8 rounded-lg">
            {user.image ? <AvatarImage src={user.image} alt="" /> : null}
            <AvatarFallback className="rounded-lg bg-brand-500 text-xs font-bold text-white">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{user.name}</span>
            <span className="truncate text-xs text-sidebar-foreground/60">
              {user.email}
            </span>
          </div>
          <ChevronsUpDownIcon className="ml-auto size-4 opacity-60" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl"
        side={isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex items-center gap-2 font-normal">
          <Avatar className="size-8 rounded-lg">
            <AvatarFallback className="rounded-lg bg-brand-600 text-xs font-bold text-white">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled>
            <UserIcon />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <ShieldCheckIcon />
            Role: <span className="capitalize">{user.role}</span>
          </DropdownMenuItem>
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
