"use client";

import { useActionState, useId, useMemo, useState, type ReactNode } from "react";
import { AlertCircleIcon, ArrowDownToLineIcon, LoaderCircleIcon, PackageCheckIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, type buttonVariants } from "@/components/ui/button";
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
import { idleState, makeValueReader, withValues, type FormState } from "@/lib/members/form-state";
import { receiveStock } from "@/lib/stock/actions";
import type { ProductOption } from "@/lib/stock/queries";
import type { VariantProps } from "class-variance-authority";
import { ProductSelect } from "./product-select";

/**
 * "Receive stock": a delivery from Herbalife goes on the shelf. One product
 * per entry; the dialog stays open after saving so a whole delivery can be
 * keyed in one line after another.
 */
export function ReceiveStockDialog({
  products,
  productId,
  today,
  variant = "default",
  size = "lg",
  children,
}: {
  products: ProductOption[];
  /** Pre-selects (and locks) the product, for the product page. */
  productId?: string;
  today: string;
  children?: ReactNode;
} & Pick<VariantProps<typeof buttonVariants>, "variant" | "size">) {
  const [open, setOpen] = useState(false);
  // Each save remounts the form so the quantity clears for the next line.
  const [round, setRound] = useState(0);
  const action = useMemo(
    () =>
      withValues(async (prev: FormState, formData: FormData) => {
        const result = await receiveStock(prev, formData);
        if (result.status === "success") setRound((r) => r + 1);
        return result;
      }),
    [],
  );
  const [state, formAction, pending] = useActionState(action, idleState);
  const read = makeValueReader(state, { productId: productId ?? "", movedOn: today });
  const errors = state.status === "error" ? state.errors : {};
  const id = useId();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant={variant} size={size}>
          {children ?? (
            <>
              <ArrowDownToLineIcon data-icon="inline-start" />
              Receive stock
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form action={formAction} className="space-y-4" noValidate key={round}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Receive stock</DialogTitle>
            <DialogDescription>Put a delivery on the shelf. Save once per product; the dialog stays open for the next line.</DialogDescription>
          </DialogHeader>

          {state.status === "error" && (errors._form || Object.keys(errors).length === 0) ? (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertDescription>{errors._form?.[0] ?? state.message ?? "Please check the form."}</AlertDescription>
            </Alert>
          ) : null}
          {state.status === "success" ? (
            <Alert className="border-brand-200 bg-brand-50 text-brand-800">
              <PackageCheckIcon className="text-foreground" />
              <AlertDescription className="text-brand-800">{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <Field label="Product" htmlFor={`${id}-product`} error={errors.productId}>
            <ProductSelect id={`${id}-product`} name="productId" products={products} defaultValue={productId ?? read.text("productId")} locked={Boolean(productId)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Quantity" htmlFor={`${id}-qty`} error={errors.quantity} hint="units">
              <Input id={`${id}-qty`} name="quantity" type="number" min={1} inputMode="numeric" defaultValue={state.status === "success" ? "" : read.text("quantity")} required autoFocus />
            </Field>
            <Field label="Received on" htmlFor={`${id}-day`} error={errors.movedOn}>
              <Input id={`${id}-day`} name="movedOn" type="date" defaultValue={read.text("movedOn")} max={today} required />
            </Field>
            <Field label="Unit cost" htmlFor={`${id}-cost`} error={errors.unitCost} hint="₹, optional">
              <Input id={`${id}-cost`} name="unitCost" type="number" min={0} step="0.01" inputMode="decimal" defaultValue={read.text("unitCost")} placeholder="what you paid" />
            </Field>
          </div>
          <Field label="Note" htmlFor={`${id}-note`} error={errors.note} hint="optional">
            <Input id={`${id}-note`} name="note" defaultValue={read.text("note")} placeholder="Invoice or order number" />
          </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={pending}>
                {state.status === "success" ? "Done" : "Cancel"}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
              Add to stock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
