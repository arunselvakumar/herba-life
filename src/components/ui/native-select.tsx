"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDownIcon } from "lucide-react"
import { useAfterFormReset } from "@/lib/form-reset"

type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  size?: "sm" | "default"
}

/**
 * Pill dropdown, styled to sit beside <Input> and the filter chips.
 *
 * After a form reset (React resets a `<form action>` once the action settles)
 * it shows `value ?? defaultValue` from its latest props, the way inputs do.
 * A plain `<select>` would show the option it had on mount instead.
 */
function NativeSelect({
  className,
  size = "default",
  ref,
  ...props
}: NativeSelectProps) {
  const selectRef = React.useRef<HTMLSelectElement>(null)
  useAfterFormReset(selectRef, () => {
    const node = selectRef.current
    const wanted = props.value ?? props.defaultValue
    if (!node || wanted === undefined || wanted === null) return
    const values = new Set((Array.isArray(wanted) ? wanted : [wanted]).map(String))
    if (node.multiple) {
      for (const option of node.options) option.selected = values.has(option.value)
    } else {
      node.value = String(wanted)
    }
  })
  const setRefs = React.useCallback(
    (node: HTMLSelectElement | null) => {
      selectRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )

  return (
    <div
      className={cn(
        "group/native-select relative w-fit has-[select:disabled]:opacity-60",
        className
      )}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <select
        data-slot="native-select"
        data-size={size}
        ref={setRefs}
        className="h-10 w-full min-w-0 appearance-none rounded-full border border-input bg-card py-1 pr-10 pl-4 text-sm font-medium text-foreground transition-[border-color,box-shadow] duration-200 outline-none select-none placeholder:text-muted-foreground hover:border-foreground/25 focus-visible:border-foreground focus-visible:ring-3 focus-visible:ring-foreground/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 data-[size=sm]:h-8 data-[size=sm]:pr-8 data-[size=sm]:pl-3 data-[size=sm]:text-[0.8rem]"
        {...props}
      />
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-transform duration-200 select-none group-has-[select:focus-visible]/native-select:rotate-180 group-data-[size=sm]/native-select:right-3 group-data-[size=sm]/native-select:size-3.5"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  )
}

function NativeSelectOption({
  className,
  ...props
}: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

function NativeSelectOptGroup({
  className,
  ...props
}: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }
