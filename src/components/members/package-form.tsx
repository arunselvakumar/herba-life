"use client";

import Link from "next/link";
import { useActionState, useMemo } from "react";
import { AlertCircleIcon, LoaderCircleIcon, PackagePlusIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { idleState, makeValueReader, withValues, type FormAction } from "@/lib/members/form-state";
import { FormSection } from "./field";
import { PackageFields, type PlanOption } from "./package-fields";

export function PackageForm({ action, today, cancelHref, plans }: { action: FormAction; today: string; cancelHref: string; plans: PlanOption[] }) {
  const wrapped = useMemo(() => withValues(action), [action]);
  const [state, formAction, pending] = useActionState(wrapped, idleState);
  const read = makeValueReader(state, { startDate: today });
  const errors = state.status === "error" ? state.errors : {};

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{state.message ?? "Please check the form."}</AlertDescription>
        </Alert>
      ) : null}
      <FormSection title="Enrolment" description="Pick a package from the catalog and when it starts." icon={PackagePlusIcon}>
        <PackageFields read={read} errors={errors} plans={plans} />
      </FormSection>
      <div className="flex justify-end gap-2">
        <Button asChild type="button" variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending || plans.length === 0}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
          Enrol in package
        </Button>
      </div>
    </form>
  );
}
