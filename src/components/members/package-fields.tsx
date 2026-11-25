"use client";

import Link from "next/link";
import { useState } from "react";
import type { PackagePlan } from "@/db/schema";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/members/format";
import type { FieldErrors } from "@/lib/members/validation";
import { Field } from "./field";

type Reader = { text(name: string): string };

/** The catalog fields a form needs; the server copies the rest at enrolment. */
export type PlanOption = Pick<PackagePlan, "id" | "name" | "visits" | "price" | "description">;

/**
 * Enrolment inputs shared by the intake form (prefixed `package.`) and the
 * standalone "new package" form. The member picks a plan from the catalog;
 * the total-visits preview updates as the plan or the extra visits change.
 */
export function PackageFields({
  prefix = "",
  read,
  errors,
  plans,
  linkedStart,
}: {
  prefix?: string;
  read: Reader;
  errors: FieldErrors;
  plans: PlanOption[];
  /** When set (the join date on intake), the start date follows it until edited. */
  linkedStart?: string;
}) {
  const n = (field: string) => `${prefix}${field}`;
  const err = (field: string) => errors[n(field)];

  const [planId, setPlanId] = useState(read.text(n("planId")));
  const [extra, setExtra] = useState(read.text(n("extraVisits")));
  const [startValue, setStart] = useState(read.text(n("startDate")));
  const [startTouched, setStartTouched] = useState(Boolean(read.text(n("startDate"))));
  // Until the user edits it, the start date mirrors the join date on intake.
  const start = !startTouched && linkedStart ? linkedStart : startValue;

  const plan = plans.find((p) => p.id === planId) ?? null;
  const extraVisits = Math.max(Number(extra) || 0, 0);
  const total = plan ? plan.visits + extraVisits : 0;

  if (plans.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        No packages in the catalog yet.{" "}
        <Link href="/packages/new" className="font-medium text-foreground hover:underline">
          Create one under Packages
        </Link>{" "}
        first.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Package" htmlFor={n("planId")} error={err("planId")} className="sm:col-span-2">
        <NativeSelect id={n("planId")} name={n("planId")} value={planId} onChange={(e) => setPlanId(e.target.value)} className="w-full" required>
          <NativeSelectOption value="">Choose a package…</NativeSelectOption>
          {plans.map((p) => (
            <NativeSelectOption key={p.id} value={p.id}>
              {p.name} · {p.visits} visits{p.price !== null ? ` · ${formatMoney(p.price)}` : ""}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {plan?.description ? <p className="text-xs text-muted-foreground">{plan.description}</p> : null}
      </Field>
      <Field label="Start date" htmlFor={n("startDate")} error={err("startDate")} hint={linkedStart ? "follows join date" : undefined}>
        <Input
          id={n("startDate")}
          name={n("startDate")}
          type="date"
          value={start}
          onChange={(e) => {
            setStartTouched(true);
            setStart(e.target.value);
          }}
          required
        />
      </Field>
      <Field label="Extra visits" htmlFor={n("extraVisits")} error={err("extraVisits")} hint="bonus">
        <Input id={n("extraVisits")} name={n("extraVisits")} type="number" min={0} inputMode="numeric" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="0" />
      </Field>
      <Field label="Total visits" className="sm:col-span-2">
        <div className="flex h-8 items-center rounded-xl border border-dashed bg-muted/40 px-2.5 text-sm">
          {plan ? (
            <span>
              <span className="font-semibold">
                {total} visit{total === 1 ? "" : "s"}
              </span>
              <span className="text-muted-foreground">
                {extraVisits > 0 ? ` (${plan.visits} + ${extraVisits})` : ""} · one a day, no end date
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Choose a package</span>
          )}
        </div>
      </Field>
      <Field label="Price" hint="from catalog">
        <div className="flex h-8 items-center rounded-xl border border-dashed bg-muted/40 px-2.5 text-sm font-semibold tabular-nums">
          {plan ? formatMoney(plan.price) : <span className="font-normal text-muted-foreground">—</span>}
        </div>
      </Field>
      <Field label="Advance paid" htmlFor={n("amountPaid")} error={err("amountPaid")} hint="₹">
        <Input id={n("amountPaid")} name={n("amountPaid")} type="number" min={0} step="1" inputMode="decimal" defaultValue={read.text(n("amountPaid"))} placeholder="0" />
      </Field>
      <Field label="Notes" htmlFor={n("notes")} error={err("notes")} className="sm:col-span-2 lg:col-span-4">
        <Textarea id={n("notes")} name={n("notes")} rows={2} defaultValue={read.text(n("notes"))} placeholder="Products included, payment plan, anything to remember" />
      </Field>
    </div>
  );
}
