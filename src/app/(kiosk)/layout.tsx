/**
 * Attendance Mode runs outside the admin shell: no sidebar, no header, no
 * search box. Just the member-facing kiosk, edge to edge on the tablet.
 */
export default function KioskLayout({ children }: LayoutProps<"/">) {
  return <div className="flex min-h-dvh flex-1 flex-col bg-background text-foreground select-none">{children}</div>;
}
