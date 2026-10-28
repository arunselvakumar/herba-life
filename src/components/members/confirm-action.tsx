"use client";

import { useState, useTransition, type ReactNode } from "react";
import { LoaderCircleIcon } from "lucide-react";
import { Button, type buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { VariantProps } from "class-variance-authority";

type ButtonVariant = VariantProps<typeof buttonVariants>;

/**
 * A button that asks for confirmation before running a (bound) Server Action.
 * Used for destructive or irreversible changes: deleting records, closing
 * packages.
 */
export function ConfirmAction({
  action,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  variant = "outline",
  size = "sm",
  className,
  children,
}: {
  action: () => Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  variant?: ButtonVariant["variant"];
  size?: ButtonVariant["size"];
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      await action();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant={variant} size={size} className={className}>
          {children}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost" disabled={isPending}>
              Keep
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            onClick={confirm}
            disabled={isPending}
          >
            {isPending ? <LoaderCircleIcon className="animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
