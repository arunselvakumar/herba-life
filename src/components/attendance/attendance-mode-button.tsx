"use client";

import { MonitorCheckIcon } from "lucide-react";
import type { buttonVariants } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { KIOSK_PATH } from "@/lib/attendance/constants";
import { hardNavigate } from "@/lib/hard-navigate";
import type { VariantProps } from "class-variance-authority";

/**
 * Opens Attendance Mode's Start screen with a full page load, so no admin page
 * from this tab stays alive (hidden) or cached behind the kiosk. Full screen
 * is requested by the Start button there, since a page load drops it.
 *
 * A shimmer runs around its edge: white on the ink pill, leaf green on the
 * white one, where a white spark would vanish.
 */
export function AttendanceModeButton({
  variant = "default",
  size = "lg",
  className,
  children,
  ...rest
}: {
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  className?: string;
  children?: React.ReactNode;
} & Pick<React.ComponentProps<"button">, "aria-label" | "title">) {
  function start() {
    hardNavigate(KIOSK_PATH);
  }

  return (
    <ShimmerButton
      type="button"
      variant={variant}
      size={size}
      shimmerColor={variant === "outline" ? "var(--hl-leaf-deep)" : undefined}
      className={className}
      onClick={start}
      {...rest}
    >
      <MonitorCheckIcon data-icon={size?.startsWith("icon") ? undefined : "inline-start"} />
      {children ?? "Attendance Mode"}
    </ShimmerButton>
  );
}
