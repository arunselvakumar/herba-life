import Link from "next/link";
import { LockKeyholeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { permissionLabel, type Permission } from "@/lib/access/permissions";

/**
 * Shown in place of a page the signed-in user's role does not unlock. Pages
 * render it instead of redirecting, so the URL stays honest and the person
 * knows what to ask an administrator for.
 */
export function NoAccess({ permission, className }: { permission: Permission; className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-foreground">
          <LockKeyholeIcon className="size-5" />
        </span>
        <p className="font-semibold">You do not have access to this</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your role does not include “{permissionLabel(permission)}”. Ask an administrator to add it to your role.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/">Back to the overview</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
