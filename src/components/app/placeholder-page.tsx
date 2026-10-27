import { ConstructionIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <div className="space-y-1">
        <p className="text-eyebrow text-brand-600">Herbalife Internal</p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card className="ring-stone/80">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <ConstructionIcon className="size-6" />
          </span>
          <p className="font-semibold">This module is not built yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            The navigation is wired up so the information architecture is in
            place. Real data and workflows land here next.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
