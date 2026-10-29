import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { GhostTitle } from "@/components/motion/ghost-title";
import { Reveal } from "@/components/motion/reveal";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  error?: string[] | undefined;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const message = error?.[0];
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint ? <span className="text-[0.7rem] text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
      {message ? (
        <p className="text-xs font-medium text-destructive" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function FormSection({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className={cn(action ? "grid-cols-[1fr_auto]" : undefined)}>
        <div className="flex items-start gap-3">
          {Icon ? (
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
              <Icon className="size-4" />
            </span>
          ) : null}
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
        </div>
        {action}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function PageHeader({
  eyebrow = "Members",
  title,
  ghost,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  /** Watermark text behind the heading. Defaults to the title when it is plain text. */
  ghost?: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  const watermark = ghost ?? (typeof title === "string" ? title : undefined);
  return (
    <Reveal data-reveal className="relative isolate -mx-4 -my-8 flex flex-col gap-4 overflow-hidden px-4 py-8 md:-mx-8 md:flex-row md:items-end md:justify-between md:px-8">
      {watermark ? <GhostTitle text={watermark} className="left-4 md:left-8" /> : null}
      <div className="relative z-10 min-w-0 space-y-1.5">
        <p className="text-eyebrow">{eyebrow}</p>
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] md:text-[2.5rem] md:leading-[1.1]">{title}</h1>
        {description ? <p className="max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="relative z-10 flex flex-wrap gap-2">{actions}</div> : null}
    </Reveal>
  );
}

/** Placeholder for a `PageHeader` that renders inside a Suspense boundary. */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-4 w-80" />
    </div>
  );
}
