import { AppHeader } from "@/components/app/app-header";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex min-h-dvh flex-1 flex-col">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </TooltipProvider>
  );
}
