import { BackgroundConstellationGrid } from "@/components/ui/background-constellation-grid";

/**
 * Attendance Mode runs outside the admin shell: no sidebar, no header, no
 * search box. Just the member-facing kiosk, edge to edge on the tablet, on
 * the same constellation mesh as the console.
 */
export default function KioskLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative isolate flex min-h-dvh flex-1 flex-col bg-background text-foreground select-none">
      <BackgroundConstellationGrid className="fixed -z-10" />
      {children}
    </div>
  );
}
