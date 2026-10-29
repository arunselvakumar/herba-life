"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  AlertCircleIcon,
  CheckCheckIcon,
  LoaderCircleIcon,
  LockIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormSection } from "@/components/members/field";
import {
  ALL_PERMISSIONS,
  PERMISSION_MODULES,
  type Permission,
  type PermissionModule,
} from "@/lib/access/permissions";
import {
  idleState,
  makeValueReader,
  withValues,
  type Defaults,
  type FormAction,
} from "@/lib/members/form-state";
import { cn } from "@/lib/utils";

// Widened so the per-module loop sees the optional `hint` on every action.
const MODULES: readonly PermissionModule[] = PERMISSION_MODULES;

/**
 * The role editor. One section per module from the permission registry, each
 * action a tappable tile. Any action implies seeing the module, so the “View”
 * tile locks on while anything else in its module is ticked.
 */
export function RoleForm({
  action,
  defaults,
  submitLabel,
  readOnly = false,
  lockedPermission,
}: {
  action: FormAction;
  defaults: Defaults;
  submitLabel: string;
  /** The built-in Administrator role: everything is shown allowed and nothing can change. */
  readOnly?: boolean;
  /** A permission the current user must keep (their own way back into this screen). */
  lockedPermission?: Permission | undefined;
}) {
  const wrapped = useMemo(() => withValues(action), [action]);
  const [state, formAction, pending] = useActionState(wrapped, idleState);
  const read = makeValueReader(state, defaults);
  const errors = state.status === "error" ? state.errors : {};

  const [selected, setSelected] = useState<Set<Permission>>(() => {
    const initial = read
      .list("permissions[]")
      .filter((p): p is Permission =>
        ALL_PERMISSIONS.includes(p as Permission),
      );
    return new Set(readOnly ? ALL_PERMISSIONS : initial);
  });

  function update(mutate: (next: Set<Permission>) => void) {
    if (readOnly) return;
    setSelected((prev) => {
      const next = new Set(prev);
      mutate(next);
      if (lockedPermission) next.add(lockedPermission);
      return next;
    });
  }

  function toggle(mod: PermissionModule, actionKey: string, checked: boolean) {
    const key = `${mod.key}.${actionKey}` as Permission;
    update((next) => {
      if (checked) {
        next.add(key);
        next.add(`${mod.key}.view` as Permission);
      } else if (actionKey === "view") {
        for (const a of mod.actions)
          next.delete(`${mod.key}.${a.key}` as Permission);
      } else {
        next.delete(key);
      }
    });
  }

  function setModule(mod: PermissionModule, allowed: boolean) {
    update((next) => {
      for (const a of mod.actions) {
        const key = `${mod.key}.${a.key}` as Permission;
        if (allowed) next.add(key);
        else next.delete(key);
      }
    });
  }

  function setAll(allowed: boolean) {
    update((next) => {
      next.clear();
      if (allowed) for (const p of ALL_PERMISSIONS) next.add(p);
    });
  }

  const total = ALL_PERMISSIONS.length;
  const count = selected.size;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>
            {errors["permissions"]?.[0] ??
              state.message ??
              "Please check the form."}
          </AlertDescription>
        </Alert>
      ) : null}

      <FormSection
        title="Role"
        description="A short name staff will recognise, and what the role is for."
        icon={ShieldCheckIcon}
      >
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <Field label="Name" htmlFor="name" error={errors.name}>
            <Input
              id="name"
              name="name"
              defaultValue={read.text("name")}
              placeholder="e.g. Front desk manager"
              required
              autoFocus={!readOnly}
              readOnly={readOnly}
              maxLength={60}
            />
          </Field>
          <Field
            label="Description"
            htmlFor="description"
            error={errors.description}
            hint="optional"
          >
            <Textarea
              id="description"
              name="description"
              rows={1}
              defaultValue={read.text("description")}
              placeholder="Who gets this role and what they look after"
              readOnly={readOnly}
              maxLength={300}
              className="min-h-10"
            />
          </Field>
        </div>
      </FormSection>

      <Card>
        <CardHeader className="grid-cols-[1fr_auto] items-center">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold">
              Permissions
            </CardTitle>
            <CardDescription>
              {readOnly ? (
                "The built-in Administrator role always has every permission, including ones added by future modules."
              ) : (
                <>
                  <span className="font-semibold text-foreground tabular-nums">
                    {count}
                  </span>{" "}
                  of {total} allowed. Tick what people with this role may do.
                </>
              )}
            </CardDescription>
          </div>
          {readOnly ? null : (
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAll(true)}
                disabled={count === total}
              >
                <CheckCheckIcon data-icon="inline-start" />
                Allow all
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAll(false)}
                disabled={
                  count === 0 ||
                  (count === 1 &&
                    lockedPermission !== undefined &&
                    selected.has(lockedPermission))
                }
              >
                <XIcon data-icon="inline-start" />
                Clear
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="px-0">
          <ul className="divide-y divide-border/70 border-t border-border/70">
            {MODULES.map((mod) => {
              const keys = mod.actions.map(
                (a) => `${mod.key}.${a.key}` as Permission,
              );
              const allowed = keys.filter((k) => selected.has(k)).length;
              const moduleState: boolean | "indeterminate" =
                allowed === 0
                  ? false
                  : allowed === keys.length
                    ? true
                    : "indeterminate";
              const othersOn = mod.actions.some(
                (a) =>
                  a.key !== "view" &&
                  selected.has(`${mod.key}.${a.key}` as Permission),
              );
              return (
                <li
                  key={mod.key}
                  className="grid gap-4 px-5 py-5 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8"
                >
                  <div className="flex items-start gap-3">
                    <label
                      className={cn(
                        // The real checkbox is an invisible overlay on the circle, so the
                        // icon stays centred and the whole circle is the hit area.
                        "relative mt-0.5 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full ring-1 transition-[background-color,box-shadow,color] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-foreground/40",
                        moduleState === true
                          ? "bg-primary text-primary-foreground ring-primary"
                          : "bg-muted text-foreground ring-transparent hover:ring-foreground/30",
                        readOnly && "cursor-default hover:ring-transparent",
                      )}
                      title={
                        readOnly
                          ? undefined
                          : moduleState === true
                            ? `Clear everything in ${mod.label}`
                            : `Allow everything in ${mod.label}`
                      }
                    >
                      <Checkbox
                        className="absolute inset-0 size-full cursor-pointer rounded-full opacity-0 after:hidden disabled:cursor-default"
                        checked={moduleState}
                        disabled={readOnly}
                        onCheckedChange={(value) =>
                          setModule(
                            mod,
                            value !== false && moduleState !== true,
                          )
                        }
                        aria-label={`Allow everything in ${mod.label}`}
                      />
                      <mod.icon className="size-4" aria-hidden />
                    </label>
                    <div className="min-w-0 space-y-0.5">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        {mod.label}
                        <span className="text-xs font-medium text-muted-foreground tabular-nums">
                          {allowed}/{keys.length}
                        </span>
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {mod.description}
                      </p>
                    </div>
                  </div>
                  <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {mod.actions.map((a) => {
                      const key = `${mod.key}.${a.key}` as Permission;
                      const checked = selected.has(key);
                      const locked =
                        readOnly ||
                        (a.key === "view" && othersOn) ||
                        key === lockedPermission;
                      const id = `perm-${mod.key}-${a.key}`;
                      return (
                        <li key={a.key}>
                          <label
                            htmlFor={id}
                            className={cn(
                              // Every tile in a row shares the row's height; the content block
                              // centres inside it so one-line labels do not float at the top.
                              "group/tile flex h-full min-h-16 cursor-pointer items-center rounded-2xl px-3.5 py-3 ring-1 transition-[background-color,box-shadow] duration-200",
                              checked
                                ? "bg-muted/80 ring-foreground/20"
                                : "bg-card ring-border hover:ring-foreground/30",
                              locked && "cursor-default",
                            )}
                          >
                            <span className="flex w-full items-start gap-3">
                              <Checkbox
                                id={id}
                                checked={checked}
                                disabled={locked}
                                onCheckedChange={(value) =>
                                  toggle(mod, a.key, value === true)
                                }
                                className="mt-0.5 disabled:opacity-100"
                              />
                              <span className="min-w-0 flex-1 leading-tight">
                                <span className="flex items-center gap-1.5 text-sm font-medium">
                                  {a.label}
                                  {locked && !readOnly ? (
                                    <LockIcon
                                      className="size-3 text-muted-foreground"
                                      aria-label={
                                        key === lockedPermission
                                          ? "Kept so you keep access to this screen"
                                          : "Needed by the other actions in this module"
                                      }
                                    />
                                  ) : null}
                                </span>
                                {a.hint ? (
                                  <span className="mt-0.5 block text-xs text-muted-foreground">
                                    {a.hint}
                                  </span>
                                ) : null}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {readOnly
        ? null
        : [...selected].map((p) => (
            <input key={p} type="hidden" name="permissions[]" value={p} />
          ))}

      <div className="flex justify-end gap-2">
        <Button asChild type="button" variant="ghost">
          <Link href="/team/roles">{readOnly ? "Back" : "Cancel"}</Link>
        </Button>
        {readOnly ? null : (
          <Button type="submit" disabled={pending}>
            {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
            {submitLabel}
          </Button>
        )}
      </div>
    </form>
  );
}
