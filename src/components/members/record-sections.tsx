"use client";

import { useState } from "react";
import { HeartPulseIcon, UtensilsIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { DIETS, PAIN_AREAS, SYMPTOMS } from "@/lib/members/constants";
import type { FieldErrors } from "@/lib/members/validation";
import { Field, FormSection } from "./field";

/**
 * Form sections from the paper wellness record that both the member intake
 * form and the inquiry form use. Field names match the shared columns in
 * src/db/record-columns.ts.
 */

export type Reader = {
  text(name: string): string;
  checked(name: string): boolean;
  list(name: string): string[];
};

export function HabitsSection({ read, errors, description }: { read: Reader; errors: FieldErrors; description?: string }) {
  return (
    <FormSection title="Eating habits" description={description ?? "A typical day, as the person describes it."} icon={UtensilsIcon}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Wake up" htmlFor="wakeUpTime" error={errors.wakeUpTime}>
          <Input id="wakeUpTime" name="wakeUpTime" defaultValue={read.text("wakeUpTime")} placeholder="6:30 am" />
        </Field>
        <Field label="Tea / coffee" htmlFor="teaCoffee" error={errors.teaCoffee}>
          <Input id="teaCoffee" name="teaCoffee" defaultValue={read.text("teaCoffee")} placeholder="2 cups with sugar" />
        </Field>
        <Field label="Diet" htmlFor="diet" error={errors.diet}>
          <NativeSelect id="diet" name="diet" defaultValue={read.text("diet")} className="w-full">
            <NativeSelectOption value="">Not specified</NativeSelectOption>
            {DIETS.map((d) => (
              <NativeSelectOption key={d.value} value={d.value}>
                {d.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Water intake" htmlFor="waterIntake" error={errors.waterIntake}>
          <Input id="waterIntake" name="waterIntake" defaultValue={read.text("waterIntake")} placeholder="2 litres" />
        </Field>
        <Field label="Breakfast" htmlFor="breakfast" error={errors.breakfast}>
          <Input id="breakfast" name="breakfast" defaultValue={read.text("breakfast")} />
        </Field>
        <Field label="Lunch" htmlFor="lunch" error={errors.lunch}>
          <Input id="lunch" name="lunch" defaultValue={read.text("lunch")} />
        </Field>
        <Field label="Evening snacks" htmlFor="eveningSnacks" error={errors.eveningSnacks}>
          <Input id="eveningSnacks" name="eveningSnacks" defaultValue={read.text("eveningSnacks")} />
        </Field>
        <Field label="Dinner" htmlFor="dinner" error={errors.dinner}>
          <Input id="dinner" name="dinner" defaultValue={read.text("dinner")} />
        </Field>
      </div>
    </FormSection>
  );
}

export function HealthSection({ read, errors }: { read: Reader; errors: FieldErrors }) {
  const [symptoms, setSymptoms] = useState<string[]>(read.list("symptoms[]"));
  const painSelected = symptoms.includes("pain");

  return (
    <FormSection title="Health condition" description="Existing conditions, medication and complaints." icon={HeartPulseIcon}>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Conditions</legend>
            <CheckRow name="hasBloodPressure" label="Blood pressure" defaultChecked={read.checked("hasBloodPressure")} />
            <CheckRow name="hasSugar" label="Sugar / diabetes" defaultChecked={read.checked("hasSugar")} />
            <CheckRow name="hasCardiac" label="Cardiac" defaultChecked={read.checked("hasCardiac")} />
          </fieldset>
          <Field label="Any medicine" htmlFor="medicines" error={errors.medicines}>
            <Textarea id="medicines" name="medicines" rows={3} defaultValue={read.text("medicines")} placeholder="Name, dose and frequency" />
          </Field>
        </div>
        <div className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Complaints</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {SYMPTOMS.map((s) => (
                <CheckRow
                  key={s.value}
                  name="symptoms[]"
                  value={s.value}
                  label={s.label}
                  checked={symptoms.includes(s.value)}
                  onCheckedChange={(checked) =>
                    setSymptoms((prev) => (checked ? [...prev, s.value] : prev.filter((v) => v !== s.value)))
                  }
                />
              ))}
            </div>
          </fieldset>
          {painSelected ? (
            <fieldset className="space-y-2 rounded-lg border bg-linen/60 p-3">
              <legend className="px-1 text-sm font-medium">Where is the pain?</legend>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {PAIN_AREAS.map((p) => (
                  <CheckRow key={p.value} name="painAreas[]" value={p.value} label={p.label} defaultChecked={read.list("painAreas[]").includes(p.value)} />
                ))}
              </div>
            </fieldset>
          ) : null}
          <Field label="Notes" htmlFor="healthNotes" error={errors.healthNotes}>
            <Textarea id="healthNotes" name="healthNotes" rows={2} defaultValue={read.text("healthNotes")} placeholder="Details about any of the above" />
          </Field>
        </div>
      </div>
    </FormSection>
  );
}

export function CheckRow({
  name,
  label,
  value,
  defaultChecked,
  checked,
  onCheckedChange,
}: {
  name: string;
  label: string;
  value?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  const id = value ? `${name}-${value}` : name;
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        name={name}
        {...(value !== undefined ? { value } : {})}
        {...(checked !== undefined ? { checked } : { defaultChecked: Boolean(defaultChecked) })}
        {...(onCheckedChange ? { onCheckedChange: (v: boolean | "indeterminate") => onCheckedChange(v === true) } : {})}
      />
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
    </div>
  );
}
