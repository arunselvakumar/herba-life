"use client";

import { useActionState, useMemo, useState } from "react";
import { LoaderCircleIcon, UserRoundXIcon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/members/field";
import { idleState, type FormAction } from "@/lib/members/form-state";

/** Close an inquiry as lost. A reason is required so the next person knows why. */
export function MarkLostDialog({ action, name }: { action: FormAction; name: string }) {
  const [open, setOpen] = useState(false);
  // Close the dialog once the action succeeds; the page then re-renders as lost.
  const closing = useMemo<FormAction>(
    () => async (prev, formData) => {
      const result = await action(prev, formData);
      if (result.status === "success") setOpen(false);
      return result;
    },
    [action],
  );
  const [state, formAction, pending] = useActionState(closing, idleState);
  const errors = state.status === "error" ? state.errors : {};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="lg">
          <UserRoundXIcon data-icon="inline-start" />
          Mark lost
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={formAction} className="space-y-4" noValidate>
          <DialogHeader>
            <DialogTitle>Mark {name} as lost?</DialogTitle>
            <DialogDescription>
              The inquiry stays on record and can be reopened later. Say briefly why they did not join.
            </DialogDescription>
          </DialogHeader>
          {state.status === "error" && !errors.lostReason ? (
            <p className="text-sm font-medium text-destructive">{state.message}</p>
          ) : null}
          <Field label="Reason" htmlFor="lostReason" error={errors.lostReason}>
            <Textarea id="lostReason" name="lostReason" rows={3} placeholder="Too expensive, joined elsewhere, not reachable…" autoFocus />
          </Field>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={pending}>
                Keep open
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
              Mark lost
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
