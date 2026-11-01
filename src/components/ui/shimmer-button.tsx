import * as React from "react"
import type { VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

/*
 * Shimmer button. Adapted from Magic UI
 * (https://21st.dev/@dillionverma/components/shimmer-button).
 *
 * A spark of light runs around the inside edge of the pill. The spark is a
 * conic gradient spinning behind the button's face, and the face is inset by
 * `shimmerSize`, so only a hairline ring of it shows.
 *
 * Changes from the original: it takes the console Button's variants and
 * sizes, the face inherits the variant's background (hover state included),
 * and reduced motion drops the spark.
 */

export type ShimmerButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Color of the travelling spark. */
    shimmerColor?: string | undefined
    /** Width of the ring the spark shows through. */
    shimmerSize?: string
    /** Time for the spark to slide across the button once. */
    shimmerDuration?: string
  }

function ShimmerButton({
  className,
  variant = "default",
  size = "default",
  shimmerColor = "#ffffff",
  shimmerSize = "0.1em",
  shimmerDuration = "3s",
  style,
  children,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      style={
        {
          "--spread": "90deg",
          "--shimmer-color": shimmerColor,
          "--speed": shimmerDuration,
          "--cut": shimmerSize,
          ...style,
        } as React.CSSProperties
      }
      className={cn(buttonVariants({ variant, size }), "relative z-0 overflow-hidden", className)}
      {...props}
    >
      {/* Spark */}
      <span
        aria-hidden
        className="absolute inset-0 -z-30 overflow-visible blur-[2px] [container-type:size] motion-reduce:hidden"
      >
        <span className="absolute inset-0 aspect-square h-[100cqh] animate-shimmer-slide">
          <span className="absolute -inset-full w-auto animate-spin-around [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]" />
        </span>
      </span>

      {/* Face */}
      <span aria-hidden className="absolute -z-20 rounded-[inherit] [background:inherit] [inset:var(--cut)]" />

      {children}

      {/* Highlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_-8px_10px_#ffffff1f] transition-shadow duration-300 ease-in-out group-hover/button:shadow-[inset_0_-6px_10px_#ffffff3f] group-active/button:shadow-[inset_0_-10px_10px_#ffffff3f]"
      />
    </button>
  )
}

export { ShimmerButton }
