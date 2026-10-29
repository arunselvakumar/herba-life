"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { AlertCircleIcon, DicesIcon, EyeIcon, EyeOffIcon, LoaderCircleIcon, UserCogIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Field, FormSection } from "@/components/members/field";
import { idleState, makeValueReader, withValues, type Defaults, type FormAction } from "@/lib/members/form-state";

export type RoleOption = { id: string; name: string; description: string | null; isSystem: boolean };

/** Readable, 14-character passwords without look-alike letters. */
function generatePassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint32Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function UserForm({
  action,
  defaults,
  roles,
  mode,
  isSelf = false,
  submitLabel,
}: {
  action: FormAction;
  defaults: Defaults;
  roles: RoleOption[];
  mode: "create" | "edit";
  /** Editing your own account: the role is shown but cannot be changed here. */
  isSelf?: boolean;
  submitLabel: string;
}) {
  const wrapped = useMemo(() => withValues(action), [action]);
  const [state, formAction, pending] = useActionState(wrapped, idleState);
  const read = makeValueReader(state, defaults);
  const errors = state.status === "error" ? state.errors : {};

  const [password, setPassword] = useState(read.text("password"));
  const [showPassword, setShowPassword] = useState(false);
  const [roleId, setRoleId] = useState(read.text("roleId"));
  const selectedRole = roles.find((r) => r.id === roleId);

  return (
    <form action={formAction} className="space-y-6" noValidate autoComplete="off">
      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{state.message ?? "Please check the form."}</AlertDescription>
        </Alert>
      ) : null}

      <FormSection
        title="Account"
        description={mode === "create" ? "They sign in with this email and password. Share the password with them directly." : "Change the name, email or role. Leave the password blank to keep it."}
        icon={UserCogIcon}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="name" error={errors.name}>
            <Input id="name" name="name" defaultValue={read.text("name")} placeholder="Full name" required autoFocus maxLength={80} autoComplete="off" />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email}>
            <Input id="email" name="email" type="email" defaultValue={read.text("email")} placeholder="name@example.com" required maxLength={254} autoComplete="off" />
          </Field>
          <Field
            label="Role"
            htmlFor="roleId"
            error={errors.roleId}
            hint={isSelf ? "ask another administrator to change yours" : undefined}
          >
            <NativeSelect
              id="roleId"
              name="roleId"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              required
              disabled={isSelf}
              aria-invalid={errors.roleId ? true : undefined}
              className="w-full"
            >
              <NativeSelectOption value="">Choose a role</NativeSelectOption>
              {roles.map((r) => (
                <NativeSelectOption key={r.id} value={r.id}>
                  {r.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {/* A disabled select is not submitted; keep the value in the form. */}
            {isSelf ? <input type="hidden" name="roleId" value={roleId} /> : null}
            {selectedRole?.description ? <p className="text-xs text-muted-foreground">{selectedRole.description}</p> : null}
          </Field>
          <Field
            label={mode === "create" ? "Password" : "New password"}
            htmlFor="password"
            error={errors.password}
            hint={mode === "create" ? "at least 8 characters" : "optional"}
          >
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "create" ? "Choose or generate one" : "Leave blank to keep the current one"}
                  required={mode === "create"}
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPassword(generatePassword());
                  setShowPassword(true);
                }}
              >
                <DicesIcon data-icon="inline-start" />
                Generate
              </Button>
            </div>
          </Field>
        </div>
      </FormSection>

      <div className="flex justify-end gap-2">
        <Button asChild type="button" variant="ghost">
          <Link href="/team/users">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
