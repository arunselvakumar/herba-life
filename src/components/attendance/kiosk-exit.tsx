"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LoaderCircleIcon, LockKeyholeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyExitPassword } from "@/lib/attendance/actions";

/**
 * The only way out of Attendance Mode. The signed-in staff member re-enters
 * their password so a visitor at the tablet cannot reach the admin screens.
 */
export function KioskExit({ staffName }: { staffName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const { ok } = await verifyExitPassword(password);
      if (!ok) {
        setError("That password is not right. Try again.");
        setPassword("");
        return;
      }
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
      router.push("/attendance");
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setPassword("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="text-white/60 hover:bg-white/10 hover:text-white">
          <LockKeyholeIcon data-icon="inline-start" />
          Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Leave Attendance Mode</DialogTitle>
            <DialogDescription>
              Enter the password for <span className="font-medium text-foreground">{staffName}</span> to go back to the admin screens.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="kiosk-exit-password">Password</Label>
            <Input
              id="kiosk-exit-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={error ? true : undefined}
              autoFocus
            />
            {error ? (
              <p className="text-xs font-medium text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={pending}>
                Stay
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending || password.length === 0}>
              {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
              Exit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
