import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base text-foreground transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-muted-foreground/80 hover:border-foreground/25 focus-visible:border-foreground focus-visible:ring-3 focus-visible:ring-foreground/10 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
