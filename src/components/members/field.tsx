import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
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
    <Card className={cn("ring-stone/80", className)}>
      <CardHeader className={cn(action ? "grid-cols-[1fr_auto]" : undefined)}>
        <div className="flex items-start gap-3">
          {Icon ? (
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <Icon className="size-4" />
            </span>
          ) : null}
          <div className="space-y-0.5">
            <CardTitle className="text-base font-bold">{title}</CardTitle>
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
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="text-eyebrow text-brand-600">{eyebrow}</p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
