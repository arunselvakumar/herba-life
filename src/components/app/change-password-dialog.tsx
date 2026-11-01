"use client";

import { useActionState, useEffect } from "react";
import { CircleCheckIcon, LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/members/field";
import { changeOwnPassword } from "@/lib/access/actions";
import { idleState } from "@/lib/members/form-state";

/** Opened from the user menu. Keyed by the caller so each opening starts with a blank form. */
export function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [state, formAction, pending] = useActionState(changeOwnPassword, idleState);
  const errors = state.status === "error" ? state.errors : {};
  const done = state.status === "success";

  // Give the confirmation a moment to be read, then get out of the way.
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => onOpenChange(false), 1500);
    return () => clearTimeout(timer);
  }, [done, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form action={formAction} className="space-y-4" noValidate>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Change password</DialogTitle>
            <DialogDescription>Other devices signed in to your account will be signed out.</DialogDescription>
          </DialogHeader>
          {done ? (
            <p className="flex items-center gap-2 text-sm font-medium" role="status">
              <CircleCheckIcon className="size-4 text-primary" />
              {state.message}
            </p>
          ) : (
            <>
              {state.status === "error" && Object.keys(errors).length === 0 ? (
                <p className="text-sm font-medium text-destructive">{state.message}</p>
              ) : null}
              <Field label="New password" htmlFor="new-password" error={errors.password} hint="At least 8 characters">
                <Input
                  id="new-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={errors.password ? true : undefined}
                  autoFocus
                />
              </Field>
              <Field label="Re-enter new password" htmlFor="confirm-password" error={errors.confirmPassword}>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={errors.confirmPassword ? true : undefined}
                />
              </Field>
            </>
          )}
          <DialogFooter>
            {done ? (
              <DialogClose asChild>
                <Button type="button">Done</Button>
              </DialogClose>
            ) : (
              <>
                <DialogClose asChild>
                  <Button type="button" variant="ghost" disabled={pending}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={pending}>
                  {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
                  Save
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
