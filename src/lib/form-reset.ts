import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

/*
 * React 19 calls `form.reset()` on a `<form action={fn}>` once the action
 * settles, at the end of the commit that renders the result. Inputs and
 * textareas come back right, because React keeps their default value in step
 * with the `value` / `defaultValue` prop. Two kinds of control do not:
 *
 * - `<select>`: React marks an option as the default only on mount, so a
 *   reset shows the mount-time option (or the first one, when controlled).
 * - Radix checkboxes: they listen for the reset and go back to the state they
 *   had on mount, calling `onCheckedChange` with it.
 *
 * These helpers let those primitives put their current props back.
 */

type FormControl = HTMLElement & { readonly form: HTMLFormElement | null };

let resettingForm: HTMLFormElement | null = null;
let listening = false;

function listenForResets() {
  if (listening || typeof document === "undefined") return;
  listening = true;
  // Capture on the document runs before any listener on the form itself.
  document.addEventListener(
    "reset",
    (event) => {
      if (!(event.target instanceof HTMLFormElement)) return;
      resettingForm = event.target;
      queueMicrotask(() => {
        resettingForm = null;
      });
    },
    true,
  );
}

/** True while `element`'s form is dispatching its `reset` event. */
export function isFormResetting(element: FormControl | null): boolean {
  return resettingForm !== null && element?.form === resettingForm;
}

/**
 * Calls `restore` after the form around `ref` resets, once React has finished
 * the commit, so `restore` sees the props that commit rendered.
 */
export function useAfterFormReset(ref: RefObject<FormControl | null>, restore: () => void) {
  const latest = useRef(restore);
  useLayoutEffect(() => {
    latest.current = restore;
  });
  useEffect(() => {
    listenForResets();
    const form = ref.current?.form;
    if (!form) return;
    const onReset = () => queueMicrotask(() => latest.current());
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [ref]);
}
