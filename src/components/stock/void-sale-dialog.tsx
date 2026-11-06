"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { AlertCircleIcon, BanIcon, LoaderCircleIcon, PackageCheckIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Field } from "@/components/members/field";
import { idleState, makeValueReader, withValues } from "@/lib/members/form-state";
import { voidSale } from "@/lib/stock/actions";

/** Reverses a sale's stock movements and marks it voided. The receipt stays on record. */
export function VoidSaleDialog({ saleId, serialNo }: { saleId: string; serialNo: number }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(withValues(voidSale.bind(null, saleId)), idleState);
  const read = makeValueReader(state, {});
  const errors = state.status === "error" ? state.errors : {};
  const id = useId();

  useEffect(() => {
    if (state.status !== "success") return;
    const timer = setTimeout(() => setOpen(false), 700);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="lg" className="text-destructive">
          <BanIcon data-icon="inline-start" />
          Void sale
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={formAction} className="space-y-4" noValidate>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Void sale #{serialNo}?</DialogTitle>
            <DialogDescription>Every unit on it goes back on the shelf. The sale stays visible, marked as voided. Sales cannot be edited; void and enter it again.</DialogDescription>
          </DialogHeader>

          {state.status === "error" && (errors._form || !errors.reason) ? (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertDescription>{errors._form?.[0] ?? state.message}</AlertDescription>
            </Alert>
          ) : null}
          {state.status === "success" ? (
            <Alert className="border-brand-200 bg-brand-50 text-brand-800">
              <PackageCheckIcon className="text-foreground" />
              <AlertDescription className="text-brand-800">{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <Field label="Reason" htmlFor={`${id}-reason`} error={errors.reason}>
            <Input id={`${id}-reason`} name="reason" defaultValue={read.text("reason")} placeholder="Wrong product, customer returned it, entered twice" required autoFocus />
          </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={pending}>
                Keep
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
              Void sale
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
