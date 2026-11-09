"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LoaderCircleIcon, LockKeyholeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { startKioskMode } from "@/lib/attendance/actions";
import { KIOSK_PATH } from "@/lib/attendance/constants";
import { hardNavigate, hardReplace } from "@/lib/hard-navigate";

/**
 * The step before the kiosk: it says what Attendance Mode does to this device
 * and locks it on "Start". Until then the kiosk page loads no member data.
 */
export function KioskStart({ staffName }: { staffName: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function start() {
    setError(null);
    // Full screen must be requested synchronously inside the click.
    const root = document.documentElement;
    if (!document.fullscreenElement && root.requestFullscreen) {
      root.requestFullscreen().catch(() => {});
    }
    startTransition(async () => {
      try {
        await startKioskMode();
      } catch {
        setError("Attendance Mode could not be started. Try again.");
        return;
      }
      // Only refresh in place if this document was loaded at the kiosk URL.
      // Otherwise earlier admin pages are still alive in this tab: reload.
      const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      const loadedHere = entry ? new URL(entry.name).pathname === KIOSK_PATH : false;
      if (loadedHere) router.refresh();
      else hardReplace(KIOSK_PATH);
    });
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-foreground">
            <LockKeyholeIcon className="size-5" />
          </span>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.02em]">Start Attendance Mode</h1>
        </CardHeader>
        <CardContent className="space-y-3 text-center text-sm text-muted-foreground">
          <p>
            This device will only show the check-in screen until the password for{" "}
            <strong className="font-semibold text-foreground">{staffName}</strong> is entered. Other devices you are signed in on are not
            affected.
          </p>
          {error ? (
            <p className="text-xs font-medium text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <Button type="button" variant="ghost" disabled={pending} onClick={() => hardNavigate("/")}>
            Go back
          </Button>
          <Button type="button" disabled={pending} onClick={start}>
            {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
            Start
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
