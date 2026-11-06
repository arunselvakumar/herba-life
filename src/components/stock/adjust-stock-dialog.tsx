"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { AlertCircleIcon, LoaderCircleIcon, PackageCheckIcon, SlidersHorizontalIcon } from "lucide-react";
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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Field } from "@/components/members/field";
import { idleState, makeValueReader, withValues } from "@/lib/members/form-state";
import { adjustStock } from "@/lib/stock/actions";

/**
 * A correction to the count: a physical count that differed, a damaged or
 * expired unit, a free sample. A reason is always required so the history
 * explains itself later.
 */
export function AdjustStockDialog({ productId, productName, onHand, today }: { productId: string; productName: string; onHand: number; today: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(withValues(adjustStock), idleState);
  const read = makeValueReader(state, { direction: "remove", movedOn: today });
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
        <Button type="button" variant="outline" size="lg">
          <SlidersHorizontalIcon data-icon="inline-start" />
          Adjust
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="productId" value={productId} />
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Adjust {productName}</DialogTitle>
            <DialogDescription>
              {onHand} on hand now. Use this for a count that differed, damaged or expired units, or a sample given out.
            </DialogDescription>
          </DialogHeader>

          {state.status === "error" && errors._form ? (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertDescription>{errors._form[0]}</AlertDescription>
            </Alert>
          ) : null}
          {state.status === "success" ? (
            <Alert className="border-brand-200 bg-brand-50 text-brand-800">
              <PackageCheckIcon className="text-foreground" />
              <AlertDescription className="text-brand-800">{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Change" htmlFor={`${id}-direction`} error={errors.direction}>
              <NativeSelect id={`${id}-direction`} name="direction" defaultValue={read.text("direction")} className="w-full">
                <NativeSelectOption value="remove">Remove</NativeSelectOption>
                <NativeSelectOption value="add">Add</NativeSelectOption>
              </NativeSelect>
            </Field>
            <Field label="Quantity" htmlFor={`${id}-qty`} error={errors.quantity} hint="units">
              <Input id={`${id}-qty`} name="quantity" type="number" min={1} inputMode="numeric" defaultValue={read.text("quantity")} required autoFocus />
            </Field>
            <Field label="On" htmlFor={`${id}-day`} error={errors.movedOn}>
              <Input id={`${id}-day`} name="movedOn" type="date" defaultValue={read.text("movedOn")} max={today} required />
            </Field>
          </div>
          <Field label="Reason" htmlFor={`${id}-reason`} error={errors.reason}>
            <Input id={`${id}-reason`} name="reason" defaultValue={read.text("reason")} placeholder="Count was off, tin damaged, sample given" required />
          </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={pending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
              Save adjustment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
