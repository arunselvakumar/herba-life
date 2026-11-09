"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { CheckIcon } from "lucide-react"
import { isFormResetting, useAfterFormReset } from "@/lib/form-reset"

type CheckedState = boolean | "indeterminate"

/**
 * Radix checkbox, kept in step with React's form reset. A Radix checkbox goes
 * back to its mount-time state when its form resets, which React does after
 * every `<form action>` result. Here a reset keeps `checked` when controlled,
 * and takes the latest `defaultChecked` when not, the way inputs do.
 */
function Checkbox({
  className,
  checked: checkedProp,
  defaultChecked,
  onCheckedChange,
  ref,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  const controlled = checkedProp !== undefined
  const [own, setOwn] = React.useState<CheckedState>(defaultChecked ?? false)
  const checked = controlled ? checkedProp : own

  const buttonRef = React.useRef<HTMLButtonElement>(null)
  useAfterFormReset(buttonRef, () => {
    if (!controlled) setOwn(defaultChecked ?? false)
  })
  const setRefs = React.useCallback(
    (node: HTMLButtonElement | null) => {
      buttonRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border border-input bg-card transition-colors outline-none group-has-disabled/field:opacity-50 group-has-[:focus-visible]/field-label:ring-0 group-has-[:focus-visible]/field-label:not-data-checked:border-input after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground group-has-[:focus-visible]/field-label:data-checked:border-primary dark:data-checked:bg-primary",
        className
      )}
      {...props}
      ref={setRefs}
      // Always controlled towards Radix, so its own reset handler cannot move it.
      checked={checked}
      // The hidden form input resets to this, so it posts what is on screen.
      defaultChecked={checked === true}
      onCheckedChange={(next) => {
        if (isFormResetting(buttonRef.current)) return
        if (!controlled) setOwn(next)
        onCheckedChange?.(next)
      }}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
