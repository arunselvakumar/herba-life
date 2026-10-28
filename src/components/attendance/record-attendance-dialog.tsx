"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertCircleIcon, LoaderCircleIcon, UserRoundCheckIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Field } from "@/components/members/field";
import { recordAttendance } from "@/lib/attendance/actions";
import { idleState, makeValueReader, withValues } from "@/lib/members/form-state";
import { fullName } from "@/lib/members/format";

type Option = { id: string; firstName: string; lastName: string; serialNo: number };

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Staff fallback for when the tablet was off or a member forgot to tap:
 * pick the member, the day and the time, and the visit is recorded as
 * "manual" so reports can tell it apart from self check-ins.
 */
export function RecordAttendanceDialog({ members, day, today }: { members: Option[]; day: string; today: string }) {
  const [open, setOpen] = useState(false);
  const [defaultTime, setDefaultTime] = useState("");
  const [state, formAction, pending] = useActionState(withValues(recordAttendance), idleState);
  const read = makeValueReader(state, { day, time: defaultTime });
  const errors = state.status === "error" ? state.errors : {};

  // Close once saved; the page re-renders with the new row via revalidatePath.
  useEffect(() => {
    if (state.status !== "success") return;
    const id = setTimeout(() => setOpen(false), 600);
    return () => clearTimeout(id);
  }, [state]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setDefaultTime(day === today ? nowTime() : "09:00");
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="lg">
          <UserRoundCheckIcon data-icon="inline-start" />
          Record a visit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={formAction} className="space-y-4" noValidate>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Record a visit</DialogTitle>
            <DialogDescription>For when someone forgot to tap the tablet. The visit is marked as recorded by staff.</DialogDescription>
          </DialogHeader>

          {state.status === "error" && errors._form ? (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertDescription>{errors._form[0]}</AlertDescription>
            </Alert>
          ) : null}
          {state.status === "success" ? (
            <Alert className="border-brand-200 bg-brand-50 text-brand-800">
              <UserRoundCheckIcon className="text-brand-600" />
              <AlertDescription className="text-brand-800">{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <Field label="Member" htmlFor="record-member" error={errors.memberId}>
            <NativeSelect id="record-member" name="memberId" defaultValue={read.text("memberId")} className="w-full" required>
              <NativeSelectOption value="">Choose a member…</NativeSelectOption>
              {members.map((m) => (
                <NativeSelectOption key={m.id} value={m.id}>
                  {fullName(m)} · #{m.serialNo}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Day" htmlFor="record-day" error={errors.day}>
              <Input id="record-day" name="day" type="date" defaultValue={read.text("day")} max={today} required />
            </Field>
            <Field label="Time" htmlFor="record-time" error={errors.time}>
              <Input id="record-time" name="time" type="time" key={defaultTime} defaultValue={read.text("time")} required />
            </Field>
          </div>
          <Field label="Note" htmlFor="record-note" error={errors.note} hint="optional">
            <Input id="record-note" name="note" defaultValue={read.text("note")} placeholder="Tablet was off, came for a refill, …" />
          </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={pending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
              Mark present
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
