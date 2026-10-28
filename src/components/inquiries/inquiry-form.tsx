"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  AlertCircleIcon,
  ContactRoundIcon,
  LoaderCircleIcon,
  MessageSquareMoreIcon,
  NotebookPenIcon,
  ScaleIcon,
  TargetIcon,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormSection } from "@/components/members/field";
import type { PlanOption } from "@/components/members/package-fields";
import { CheckRow, HabitsSection, HealthSection } from "@/components/members/record-sections";
import { GOALS, INQUIRY_SOURCES } from "@/lib/inquiries/constants";
import type { MemberOption, StaffOption } from "@/lib/inquiries/queries";
import { GENDERS, MEASUREMENTS } from "@/lib/members/constants";
import { ageOn } from "@/lib/members/dates";
import { idleState, makeValueReader, withValues, type Defaults, type FormAction } from "@/lib/members/form-state";
import { formatMoney, fullName } from "@/lib/members/format";

export function InquiryForm({
  mode,
  action,
  defaults,
  today,
  cancelHref,
  plans,
  staff,
  members,
}: {
  mode: "create" | "edit";
  action: FormAction;
  defaults: Defaults;
  today: string;
  cancelHref: string;
  plans: PlanOption[];
  staff: StaffOption[];
  members: MemberOption[];
}) {
  const wrapped = useMemo(() => withValues(action), [action]);
  const [state, formAction, pending] = useActionState(wrapped, idleState);
  const read = makeValueReader(state, defaults);
  const errors = state.status === "error" ? state.errors : {};

  const [dateOfBirth, setDateOfBirth] = useState(read.text("dateOfBirth"));
  const derivedAge = /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ? ageOn(dateOfBirth, today) : null;
  const [source, setSource] = useState(read.text("source") || "walk_in");
  const [planId, setPlanId] = useState(read.text("interestedPlanId"));
  const plan = plans.find((p) => p.id === planId) ?? null;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{state.message ?? "Please check the form."}</AlertDescription>
        </Alert>
      ) : null}

      <FormSection title="Enquiry" description="When and how this person reached the branch, and who is following up." icon={MessageSquareMoreIcon}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Enquired on" htmlFor="inquiredOn" error={errors.inquiredOn}>
            <Input id="inquiredOn" name="inquiredOn" type="date" defaultValue={read.text("inquiredOn") || today} max={today} required />
          </Field>
          <Field label="Source" htmlFor="source" error={errors.source}>
            <NativeSelect id="source" name="source" value={source} onChange={(e) => setSource(e.target.value)} className="w-full" required>
              {INQUIRY_SOURCES.map((s) => (
                <NativeSelectOption key={s.value} value={s.value}>
                  {s.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Assigned to" htmlFor="assignedTo" error={errors.assignedTo} hint="who follows up">
            <NativeSelect id="assignedTo" name="assignedTo" defaultValue={read.text("assignedTo")} className="w-full">
              <NativeSelectOption value="">Unassigned</NativeSelectOption>
              {staff.map((s) => (
                <NativeSelectOption key={s.id} value={s.id}>
                  {s.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Next follow-up" htmlFor="nextFollowUpOn" error={errors.nextFollowUpOn} hint="call or visit">
            <Input id="nextFollowUpOn" name="nextFollowUpOn" type="date" defaultValue={read.text("nextFollowUpOn")} />
          </Field>
          <Field label="Referred by" htmlFor="referredBy" error={errors.referredBy} hint={source === "referral" ? "name of the referrer" : undefined} className="sm:col-span-1 lg:col-span-2">
            <Input id="referredBy" name="referredBy" defaultValue={read.text("referredBy")} autoComplete="off" placeholder="Name, if someone sent them" />
          </Field>
          <Field label="Referring member" htmlFor="referredByMemberId" error={errors.referredByMemberId} hint="if they are a member" className="sm:col-span-1 lg:col-span-2">
            <NativeSelect id="referredByMemberId" name="referredByMemberId" defaultValue={read.text("referredByMemberId")} className="w-full">
              <NativeSelectOption value="">Not a member</NativeSelectOption>
              {members.map((m) => (
                <NativeSelectOption key={m.id} value={m.id}>
                  #{m.serialNo} · {fullName(m)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        </div>
      </FormSection>

      <FormSection title="Personal details" description="Only the first name is needed to save; capture the rest as the conversation allows." icon={ContactRoundIcon}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="First name" htmlFor="firstName" error={errors.firstName}>
            <Input id="firstName" name="firstName" defaultValue={read.text("firstName")} autoComplete="off" required autoFocus={mode === "create"} />
          </Field>
          <Field label="Last name" htmlFor="lastName" error={errors.lastName}>
            <Input id="lastName" name="lastName" defaultValue={read.text("lastName")} autoComplete="off" />
          </Field>
          <Field label="Gender" htmlFor="gender" error={errors.gender}>
            <NativeSelect id="gender" name="gender" defaultValue={read.text("gender")} className="w-full">
              <NativeSelectOption value="">Not specified</NativeSelectOption>
              {GENDERS.map((g) => (
                <NativeSelectOption key={g.value} value={g.value}>
                  {g.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Mobile" htmlFor="mobile" error={errors.mobile}>
            <Input id="mobile" name="mobile" type="tel" inputMode="tel" defaultValue={read.text("mobile")} autoComplete="off" />
          </Field>
          <Field label="Date of birth" htmlFor="dateOfBirth" error={errors.dateOfBirth} hint={derivedAge !== null ? `${derivedAge} years` : undefined}>
            <Input id="dateOfBirth" name="dateOfBirth" type="date" value={dateOfBirth} max={today} onChange={(e) => setDateOfBirth(e.target.value)} />
          </Field>
          <Field label="Age" htmlFor="age" error={errors.age} hint="if DOB unknown">
            <Input id="age" name="age" type="number" min={0} max={150} inputMode="numeric" defaultValue={read.text("age")} disabled={derivedAge !== null} placeholder={derivedAge !== null ? String(derivedAge) : ""} />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email}>
            <Input id="email" name="email" type="email" defaultValue={read.text("email")} autoComplete="off" />
          </Field>
          <Field label="Best time to contact" htmlFor="preferredContactTime" error={errors.preferredContactTime}>
            <Input id="preferredContactTime" name="preferredContactTime" defaultValue={read.text("preferredContactTime")} placeholder="Evenings after 6" />
          </Field>
          <Field label="Address" htmlFor="address" error={errors.address} className="sm:col-span-2 lg:col-span-4">
            <Textarea id="address" name="address" rows={2} defaultValue={read.text("address")} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="What they want" description="Their goals in their own words, and the package they showed interest in." icon={TargetIcon}>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Goals</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {GOALS.map((g) => (
                <CheckRow key={g.value} name="goals[]" value={g.value} label={g.label} defaultChecked={read.list("goals[]").includes(g.value)} />
              ))}
            </div>
            {errors.goals?.[0] ? <p className="text-xs font-medium text-destructive">{errors.goals[0]}</p> : null}
          </fieldset>
          <div className="space-y-4">
            <Field label="Goal notes" htmlFor="goalNotes" error={errors.goalNotes}>
              <Textarea id="goalNotes" name="goalNotes" rows={3} defaultValue={read.text("goalNotes")} placeholder="Target weight, an event they are preparing for, what they have tried before" />
            </Field>
            <Field label="Interested package" htmlFor="interestedPlanId" error={errors.interestedPlanId}>
              <NativeSelect id="interestedPlanId" name="interestedPlanId" value={planId} onChange={(e) => setPlanId(e.target.value)} className="w-full">
                <NativeSelectOption value="">Not decided yet</NativeSelectOption>
                {plans.map((p) => (
                  <NativeSelectOption key={p.id} value={p.id}>
                    {p.name} · {p.durationDays} days{p.price !== null ? ` · ${formatMoney(p.price)}` : ""}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {plan?.description ? <p className="text-xs text-muted-foreground">{plan.description}</p> : null}
            </Field>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Free check readings"
        description="If they had a body-composition check, enter it here. It becomes the baseline when they join."
        icon={ScaleIcon}
      >
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Field label="Height" htmlFor="heightCm" error={errors.heightCm} hint="cm">
            <Input id="heightCm" name="heightCm" type="number" step="0.5" min={30} inputMode="decimal" defaultValue={read.text("heightCm")} placeholder="cm" />
          </Field>
          {MEASUREMENTS.map((m) => (
            <Field key={m.key} label={m.label} htmlFor={m.key} error={errors[m.key]} hint={m.hint ?? m.unit}>
              <Input id={m.key} name={m.key} type="number" step={m.step} min={0} inputMode="decimal" defaultValue={read.text(m.key)} placeholder={m.unit} />
            </Field>
          ))}
        </div>
      </FormSection>

      <HabitsSection read={read} errors={errors} />
      <HealthSection read={read} errors={errors} />

      <FormSection title="Remarks" icon={NotebookPenIcon}>
        <Textarea id="remarks" name="remarks" rows={3} defaultValue={read.text("remarks")} placeholder="Objections, budget, who makes the decision at home, anything worth remembering" aria-label="Remarks" />
        {errors.remarks?.[0] ? <p className="text-xs font-medium text-destructive">{errors.remarks[0]}</p> : null}
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t bg-background/90 px-4 py-3 backdrop-blur md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <Button asChild type="button" variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
          {mode === "create" ? "Save enquiry" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
