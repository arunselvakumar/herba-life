"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  AlertCircleIcon,
  ContactRoundIcon,
  HeartPulseIcon,
  LoaderCircleIcon,
  NotebookPenIcon,
  PackagePlusIcon,
  ScaleIcon,
  UtensilsIcon,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { DIETS, GENDERS, MEASUREMENTS, PAIN_AREAS, SYMPTOMS } from "@/lib/members/constants";
import { ageOn } from "@/lib/members/dates";
import { idleState, makeValueReader, withValues, type Defaults, type FormAction } from "@/lib/members/form-state";
import { Field, FormSection } from "./field";
import { PackageFields, type PlanOption } from "./package-fields";

export function MemberForm({
  mode,
  action,
  defaults,
  today,
  cancelHref,
  plans = [],
}: {
  mode: "create" | "edit";
  action: FormAction;
  defaults: Defaults;
  today: string;
  cancelHref: string;
  /** Catalog packages offered on intake (create mode only). */
  plans?: PlanOption[];
}) {
  const wrapped = useMemo(() => withValues(action), [action]);
  const [state, formAction, pending] = useActionState(wrapped, idleState);
  const read = makeValueReader(state, defaults);
  const errors = state.status === "error" ? state.errors : {};

  const [dateOfBirth, setDateOfBirth] = useState(read.text("dateOfBirth"));
  const [joinedOn, setJoinedOn] = useState(read.text("joinedOn") || today);
  const derivedAge = /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ? ageOn(dateOfBirth, today) : null;
  const [withPackage, setWithPackage] = useState(read.checked("package.enabled"));
  const [symptoms, setSymptoms] = useState<string[]>(read.list("symptoms[]"));
  const painSelected = symptoms.includes("pain");

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{state.message ?? "Please check the form."}</AlertDescription>
        </Alert>
      ) : null}

      <FormSection title="Personal details" description="Who the member is and how to reach them." icon={ContactRoundIcon}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="First name" htmlFor="firstName" error={errors.firstName}>
            <Input id="firstName" name="firstName" defaultValue={read.text("firstName")} autoComplete="off" required autoFocus={mode === "create"} />
          </Field>
          <Field label="Last name" htmlFor="lastName" error={errors.lastName}>
            <Input id="lastName" name="lastName" defaultValue={read.text("lastName")} autoComplete="off" />
          </Field>
          <Field label="Gender" htmlFor="gender" error={errors.gender} hint="sets reference ranges">
            <NativeSelect id="gender" name="gender" defaultValue={read.text("gender")} className="w-full">
              <NativeSelectOption value="">Not specified</NativeSelectOption>
              {GENDERS.map((g) => (
                <NativeSelectOption key={g.value} value={g.value}>
                  {g.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Joined on" htmlFor="joinedOn" error={errors.joinedOn}>
            <Input id="joinedOn" name="joinedOn" type="date" value={joinedOn} onChange={(e) => setJoinedOn(e.target.value)} required />
          </Field>
          <Field label="Date of birth" htmlFor="dateOfBirth" error={errors.dateOfBirth} hint={derivedAge !== null ? `${derivedAge} years` : undefined}>
            <Input id="dateOfBirth" name="dateOfBirth" type="date" value={dateOfBirth} max={today} onChange={(e) => setDateOfBirth(e.target.value)} />
          </Field>
          <Field label="Age" htmlFor="age" error={errors.age} hint="if DOB unknown">
            <Input id="age" name="age" type="number" min={0} max={150} inputMode="numeric" defaultValue={read.text("age")} disabled={derivedAge !== null} placeholder={derivedAge !== null ? String(derivedAge) : ""} />
          </Field>
          <Field label="Mobile" htmlFor="mobile" error={errors.mobile}>
            <Input id="mobile" name="mobile" type="tel" inputMode="tel" defaultValue={read.text("mobile")} autoComplete="off" />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email}>
            <Input id="email" name="email" type="email" defaultValue={read.text("email")} autoComplete="off" />
          </Field>
          <Field label="Address" htmlFor="address" error={errors.address} className="sm:col-span-2 lg:col-span-3">
            <Textarea id="address" name="address" rows={2} defaultValue={read.text("address")} />
          </Field>
          <Field label="Referred by" htmlFor="referredBy" error={errors.referredBy}>
            <Input id="referredBy" name="referredBy" defaultValue={read.text("referredBy")} autoComplete="off" />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title={mode === "create" ? "Measurements at enrolment" : "Height"}
        description={
          mode === "create"
            ? "Height is kept on the profile. The other readings become the first follow-up entry."
            : "Follow-up readings are recorded from the member's profile page."
        }
        icon={ScaleIcon}
      >
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Field label="Height" htmlFor="heightCm" error={errors.heightCm} hint="cm">
            <Input id="heightCm" name="heightCm" type="number" step="0.5" min={30} inputMode="decimal" defaultValue={read.text("heightCm")} placeholder="cm" />
          </Field>
          {mode === "create"
            ? MEASUREMENTS.map((m) => (
                <Field key={m.key} label={m.label} htmlFor={`baseline.${m.key}`} error={errors[`baseline.${m.key}`]} hint={m.hint ?? m.unit}>
                  <Input
                    id={`baseline.${m.key}`}
                    name={`baseline.${m.key}`}
                    type="number"
                    step={m.step}
                    min={0}
                    inputMode="decimal"
                    defaultValue={read.text(`baseline.${m.key}`)}
                    placeholder={m.unit}
                  />
                </Field>
              ))
            : null}
        </div>
      </FormSection>

      <FormSection title="Eating habits" description="A typical day, as the member describes it." icon={UtensilsIcon}>
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

      {mode === "create" ? (
        <FormSection
          title="Package"
          description="Enrol the member in a package from the catalog. It starts on the join date unless you change it."
          icon={PackagePlusIcon}
          action={
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox name="package.enabled" checked={withPackage} onCheckedChange={(v) => setWithPackage(v === true)} />
              Start a package now
            </label>
          }
        >
          {withPackage ? (
            <PackageFields prefix="package." read={read} errors={errors} plans={plans} linkedStart={joinedOn} />
          ) : (
            <p className="text-sm text-muted-foreground">You can also add a package later from the member&rsquo;s profile.</p>
          )}
        </FormSection>
      ) : null}

      <FormSection title="Remarks" icon={NotebookPenIcon}>
        <Textarea id="remarks" name="remarks" rows={3} defaultValue={read.text("remarks")} placeholder="Goals, observations, anything worth remembering" aria-label="Remarks" />
        {errors.remarks?.[0] ? <p className="text-xs font-medium text-destructive">{errors.remarks[0]}</p> : null}
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t bg-background/90 px-4 py-3 backdrop-blur md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <Button asChild type="button" variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
          {mode === "create" ? "Save member" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function CheckRow({
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
