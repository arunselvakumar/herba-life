"use client";

import Link from "next/link";
import { useActionState, useMemo } from "react";
import { AlertCircleIcon, LoaderCircleIcon, PackageIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormSection } from "@/components/members/field";
import { idleState, makeValueReader, withValues, type Defaults, type FormAction } from "@/lib/members/form-state";

const QUICK_DURATIONS = [
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
  { label: "6 months", days: 180 },
  { label: "12 months", days: 365 },
] as const;

export function PlanForm({
  action,
  defaults,
  submitLabel,
}: {
  action: FormAction;
  defaults: Defaults;
  submitLabel: string;
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
      <FormSection
        title="Package details"
        description="What the branch sells. Members enrolled later get these values copied to their record."
        icon={PackageIcon}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Name" htmlFor="name" error={errors.name} className="sm:col-span-2">
            <Input id="name" name="name" defaultValue={read.text("name")} placeholder="e.g. 3 months" required autoFocus />
          </Field>
          <Field label="Duration" htmlFor="durationDays" error={errors.durationDays} hint="days">
            <Input id="durationDays" name="durationDays" type="number" min={1} inputMode="numeric" defaultValue={read.text("durationDays")} required list="quick-durations" />
            <datalist id="quick-durations">
              {QUICK_DURATIONS.map((q) => (
                <option key={q.days} value={q.days}>
                  {q.label}
                </option>
              ))}
            </datalist>
          </Field>
          <Field label="Price" htmlFor="price" error={errors.price} hint="₹, optional">
            <Input id="price" name="price" type="number" min={0} step="1" inputMode="decimal" defaultValue={read.text("price")} placeholder="0" />
          </Field>
          <Field label="Description" htmlFor="description" error={errors.description} className="sm:col-span-2 lg:col-span-3">
            <Textarea id="description" name="description" rows={2} defaultValue={read.text("description")} placeholder="What is included, who it is for" />
          </Field>
          <Field label="Sort order" htmlFor="sortOrder" error={errors.sortOrder} hint="lower shows first">
            <Input id="sortOrder" name="sortOrder" type="number" min={0} inputMode="numeric" defaultValue={read.text("sortOrder")} placeholder="0" />
          </Field>
        </div>
      </FormSection>
      <div className="flex justify-end gap-2">
        <Button asChild type="button" variant="ghost">
          <Link href="/packages">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
