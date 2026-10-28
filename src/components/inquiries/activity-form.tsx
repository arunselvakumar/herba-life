"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertCircleIcon, CircleCheckIcon, LoaderCircleIcon, PhoneCallIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormSection } from "@/components/members/field";
import { ACTIVITY_TYPES } from "@/lib/inquiries/constants";
import { idleState, makeValueReader, withValues, type FormAction } from "@/lib/members/form-state";

/** Log a call, WhatsApp, visit or note and set when to follow up next. */
export function ActivityForm({
  action,
  today,
  nextFollowUpOn,
}: {
  action: FormAction;
  today: string;
  /** The inquiry's current reminder; shown as the default so staff can keep or move it. */
  nextFollowUpOn: string | null;
}) {
  const wrapped = useMemo(() => withValues(action), [action]);
  const [state, formAction, pending] = useActionState(wrapped, idleState);
  const read = makeValueReader(state, { occurredOn: today, type: "call", nextFollowUpOn: nextFollowUpOn ?? "" });
  const errors = state.status === "error" ? state.errors : {};
  const [type, setType] = useState(read.text("type"));

  return (
    <FormSection
      title="Log a follow-up"
      description="What happened, and when to get in touch next. Leave the next date blank to stop reminders."
      icon={PhoneCallIcon}
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

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="What" htmlFor="type" error={errors.type}>
            <NativeSelect id="type" name="type" value={type} onChange={(e) => setType(e.target.value)} className="w-full" required>
              {ACTIVITY_TYPES.map((t) => (
                <NativeSelectOption key={t.value} value={t.value}>
                  {t.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field label="On" htmlFor="occurredOn" error={errors.occurredOn}>
            <Input id="occurredOn" name="occurredOn" type="date" defaultValue={read.text("occurredOn")} max={today} required />
          </Field>
          <Field label="Next follow-up" htmlFor="activity-nextFollowUpOn" error={errors.nextFollowUpOn} hint="blank = none">
            <Input id="activity-nextFollowUpOn" name="nextFollowUpOn" type="date" defaultValue={read.text("nextFollowUpOn")} />
          </Field>
          <Field label="Notes" htmlFor="activity-notes" error={errors.notes} className="sm:col-span-3">
            <Textarea
              id="activity-notes"
              name="notes"
              rows={2}
              defaultValue={read.text("notes")}
              placeholder={type === "note" ? "What to remember" : "How did it go? Any objections, questions, promises?"}
            />
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
