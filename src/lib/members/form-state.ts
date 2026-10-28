import type { FieldErrors } from "./validation";

/** Raw field values captured on the member so a failed submit keeps what was typed. */
export type FormValues = Record<string, string | string[]>;

export type FormState =
  | { status: "idle" }
  | { status: "error"; message?: string; errors: FieldErrors; values?: FormValues }
  | { status: "success"; message?: string };

export const idleState: FormState = { status: "idle" };

export type FormAction = (prev: FormState, formData: FormData) => Promise<FormState>;

export function snapshotFormData(formData: FormData): FormValues {
  const values: FormValues = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$ACTION") || typeof value !== "string") continue;
    if (key.endsWith("[]")) {
      const list = (values[key] ??= []) as string[];
      list.push(value);
    } else {
      values[key] = value;
    }
  }
  return values;
}

/** Wraps a Server Action so validation errors carry the submitted values back. */
export function withValues(action: FormAction): FormAction {
  return async (prev, formData) => {
    const result = await action(prev, formData);
    if (result.status === "error") {
      return { ...result, values: snapshotFormData(formData) };
    }
    return result;
  };
}

export type Defaults = Record<string, string | string[] | boolean | number | null | undefined>;

export function makeValueReader(state: FormState, defaults: Defaults) {
  const submitted = state.status === "error" ? state.values : undefined;
  return {
    text(name: string): string {
      const v = submitted ? submitted[name] : defaults[name];
      if (v === null || v === undefined) return "";
      if (Array.isArray(v)) return v[0] ?? "";
      return typeof v === "boolean" ? (v ? "on" : "") : String(v);
    },
    checked(name: string): boolean {
      if (submitted) return submitted[name] === "on";
      const v = defaults[name];
      return v === true || v === "on";
    },
    list(name: string): string[] {
      const v = submitted ? submitted[name] : defaults[name];
      return Array.isArray(v) ? v : [];
    },
  };
}
