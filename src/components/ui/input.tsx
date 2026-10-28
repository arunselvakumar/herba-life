import * as React from "react"
import { cn } from "@/lib/utils"

/** Pill text field on a white surface; the border darkens to ink on focus. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-full border border-input bg-card px-4 py-1 text-base text-foreground transition-[border-color,box-shadow,background-color] duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/80 hover:border-foreground/25 focus-visible:border-foreground focus-visible:ring-3 focus-visible:ring-foreground/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 md:text-sm [&::-webkit-search-cancel-button]:hidden",
        className
      )}
      {...props}
    />
  )
}

export { Input }
