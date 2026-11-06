"use client";

import Link from "next/link";
import { useActionState, useMemo } from "react";
import { AlertCircleIcon, LoaderCircleIcon, PackageIcon, TagIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormSection } from "@/components/members/field";
import { idleState, makeValueReader, withValues, type Defaults, type FormAction } from "@/lib/members/form-state";

export function ProductForm({
  action,
  defaults,
  categories,
  submitLabel,
  cancelHref,
}: {
  action: FormAction;
  defaults: Defaults;
  categories: string[];
  submitLabel: string;
  cancelHref: string;
}) {
  const wrapped = useMemo(() => withValues(action), [action]);
  const [state, formAction, pending] = useActionState(wrapped, idleState);
  const read = makeValueReader(state, defaults);
  const errors = state.status === "error" ? state.errors : {};

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{state.message ?? "Please check the form."}</AlertDescription>
        </Alert>
      ) : null}
      <FormSection title="Product" description="As printed on the Herbalife price list." icon={PackageIcon}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Field label="Stock number" htmlFor="stockNo" error={errors.stockNo} hint="e.g. 1247, 082K">
            <Input id="stockNo" name="stockNo" defaultValue={read.text("stockNo")} autoComplete="off" required autoFocus className="font-mono uppercase" />
          </Field>
          <Field label="Name" htmlFor="name" error={errors.name} className="sm:col-span-2 lg:col-span-3">
            <Input id="name" name="name" defaultValue={read.text("name")} placeholder="Formula 1 Nutritional Shake Mix – Vanilla – 500 gms" required />
          </Field>
          <Field label="Category" htmlFor="category" error={errors.category} className="lg:col-span-2">
            <Input id="category" name="category" defaultValue={read.text("category")} list="product-categories" placeholder="Weight management" required />
            <datalist id="product-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Volume points" htmlFor="volumePoints" error={errors.volumePoints} hint="VP, optional">
            <Input id="volumePoints" name="volumePoints" type="number" min={0} step="0.01" inputMode="decimal" defaultValue={read.text("volumePoints")} placeholder="0.00" />
          </Field>
          <Field label="Reorder level" htmlFor="reorderLevel" error={errors.reorderLevel} hint="running low at or below">
            <Input id="reorderLevel" name="reorderLevel" type="number" min={0} inputMode="numeric" defaultValue={read.text("reorderLevel")} placeholder="2" />
          </Field>
          <Field label="Sort order" htmlFor="sortOrder" error={errors.sortOrder} hint="lower shows first">
            <Input id="sortOrder" name="sortOrder" type="number" min={0} inputMode="numeric" defaultValue={read.text("sortOrder")} placeholder="0" />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Prices" description="₹, inclusive of GST. Sales copy the price at the time, so changing these never rewrites old receipts." icon={TagIcon}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="MRP" htmlFor="mrp" error={errors.mrp}>
            <Input id="mrp" name="mrp" type="number" min={0} step="0.01" inputMode="decimal" defaultValue={read.text("mrp")} required />
          </Field>
          <Field label="Bronze" htmlFor="bronzePrice" error={errors.bronzePrice} hint="introductory">
            <Input id="bronzePrice" name="bronzePrice" type="number" min={0} step="0.01" inputMode="decimal" defaultValue={read.text("bronzePrice")} />
          </Field>
          <Field label="Silver" htmlFor="silverPrice" error={errors.silverPrice} hint="100 VP">
            <Input id="silverPrice" name="silverPrice" type="number" min={0} step="0.01" inputMode="decimal" defaultValue={read.text("silverPrice")} />
          </Field>
          <Field label="Gold" htmlFor="goldPrice" error={errors.goldPrice} hint="500 VP">
            <Input id="goldPrice" name="goldPrice" type="number" min={0} step="0.01" inputMode="decimal" defaultValue={read.text("goldPrice")} />
          </Field>
        </div>
      </FormSection>

      <div className="flex justify-end gap-2">
        <Button asChild type="button" variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
