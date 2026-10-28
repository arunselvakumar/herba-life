"use client";

import { useRouter } from "next/navigation";
import { MonitorCheckIcon } from "lucide-react";
import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

/**
 * Opens Attendance Mode. Browsers only allow entering full screen from a user
 * gesture, so the request happens here on the click, before the client-side
 * navigation to the kiosk; the document stays full screen across it.
 */
export function AttendanceModeButton({
  variant = "default",
  size = "lg",
  className,
  children,
}: {
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  className?: string;
  children?: React.ReactNode;
}) {
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
    <Button type="button" variant={variant} size={size} className={className} onClick={start}>
      <MonitorCheckIcon data-icon="inline-start" />
      {children ?? "Attendance Mode"}
    </Button>
  );
}
