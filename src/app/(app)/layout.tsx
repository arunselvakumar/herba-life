import { AppHeader } from "@/components/app/app-header";
import { BackgroundCubesGrid } from "@/components/ui/background-cubes-grid";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="relative isolate flex min-h-dvh flex-1 flex-col">
        {/* Viewport-fixed so the field stays put while the page scrolls; the
            header's backdrop blur and the white cards sit on top of it. */}
        <BackgroundCubesGrid className="fixed -z-10" />
        <AppHeader />
        <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </TooltipProvider>
  );
}
