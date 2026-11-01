"use client";

import { useRouter } from "next/navigation";
import { MonitorCheckIcon } from "lucide-react";
import type { buttonVariants } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import type { VariantProps } from "class-variance-authority";

/**
 * Opens Attendance Mode. Browsers only allow entering full screen from a user
 * gesture, so the request happens here on the click, before the client-side
 * navigation to the kiosk; the document stays full screen across it.
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
  const router = useRouter();

  function start() {
    const root = document.documentElement;
    if (!document.fullscreenElement && root.requestFullscreen) {
      root.requestFullscreen().catch(() => {
        /* Not allowed (e.g. iframe) — the kiosk offers a button for it too. */
      });
    }
    router.push("/attendance/kiosk");
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
