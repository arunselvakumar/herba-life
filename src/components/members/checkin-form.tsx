"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertCircleIcon, CircleCheckIcon, LoaderCircleIcon, NotebookPenIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MEASUREMENTS } from "@/lib/members/constants";
import { computeBmi } from "@/lib/members/format";
import { idleState, makeValueReader, withValues, type FormAction } from "@/lib/members/form-state";
import { Field, FormSection } from "./field";

export function CheckinForm({
  action,
  today,
  heightCm,
}: {
  action: FormAction;
  today: string;
  heightCm: number | null;
}) {
  const wrapped = useMemo(() => withValues(action), [action]);
  const [state, formAction, pending] = useActionState(wrapped, idleState);
  const read = makeValueReader(state, { recordedOn: today });
  const errors = state.status === "error" ? state.errors : {};

  // Weight and BMI are tracked locally so the BMI can be suggested from the
  // member's height; everything else stays uncontrolled.
  const [weight, setWeight] = useState(read.text("weightKg"));
  const [bmi, setBmi] = useState(read.text("bmi"));
  const weightNumber = Number(weight);
  const suggestedBmi = heightCm && weightNumber > 0 ? computeBmi(weightNumber, heightCm) : null;

  return (
    <FormSection
      title="Record a follow-up"
      description="Enter the readings from today's visit. Leave anything you did not measure blank."
      icon={NotebookPenIcon}
    >
      <form action={formAction} className="space-y-4" noValidate>
        {state.status === "error" ? (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{errors._form?.[0] ?? state.message ?? "Please check the form."}</AlertDescription>
          </Alert>
        ) : null}
        {state.status === "success" ? (
          <Alert className="border-brand-200 bg-brand-50 text-brand-800">
            <CircleCheckIcon className="text-brand-600" />
            <AlertDescription className="text-brand-800">{state.message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Field label="Visit date" htmlFor="recordedOn" error={errors.recordedOn}>
            <Input id="recordedOn" name="recordedOn" type="date" defaultValue={read.text("recordedOn")} max={today} required />
          </Field>
          {MEASUREMENTS.map((m) => {
            const controlled = m.key === "weightKg" || m.key === "bmi";
            return (
              <Field
                key={m.key}
                label={m.label}
                htmlFor={m.key}
                error={errors[m.key]}
                hint={m.hint ?? m.unit}
              >
                <Input
                  id={m.key}
                  name={m.key}
                  type="number"
                  inputMode="decimal"
                  step={m.step}
                  min={0}
                  placeholder={m.unit}
                  {...(controlled
                    ? {
                        value: m.key === "weightKg" ? weight : bmi,
                        onChange: (e) => (m.key === "weightKg" ? setWeight(e.target.value) : setBmi(e.target.value)),
                      }
                    : { defaultValue: read.text(m.key) })}
                />
                {m.key === "bmi" && suggestedBmi !== null && String(suggestedBmi) !== bmi ? (
                  <button
                    type="button"
                    className="text-[0.7rem] font-medium text-brand-600 hover:underline"
                    onClick={() => setBmi(String(suggestedBmi))}
                  >
                    Use {suggestedBmi} from height {heightCm} cm
                  </button>
                ) : null}
              </Field>
            );
          })}
          <Field label="Remarks" htmlFor="remarks" error={errors.remarks} className="sm:col-span-3 lg:col-span-5">
            <Textarea id="remarks" name="remarks" rows={2} defaultValue={read.text("remarks")} placeholder="How the member is feeling, product changes, next steps" />
          </Field>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
            Save follow-up
          </Button>
        </div>
      </form>
    </FormSection>
  );
}
