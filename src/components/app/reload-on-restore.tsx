"use client";

import { useEffect } from "react";

/**
 * A page the Back button restores from the browser's back/forward cache is
 * the markup from before, perhaps from before this device went into
 * Attendance Mode. Hide it and load it again, so the server decides what to
 * show.
 */
export function ReloadOnRestore() {
  useEffect(() => {
    function onShow(event: PageTransitionEvent) {
      if (!event.persisted) return;
      // Restored from the browser's back/forward cache: the markup is from
      // before a possible lock. Hide it and ask the server again.
      document.documentElement.style.visibility = "hidden";
      window.location.reload();
    }
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);
  return null;
}
