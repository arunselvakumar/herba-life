import Link from "next/link";
import { PackageSearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ProductNotFound() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <PackageSearchIcon className="size-6" />
        </span>
        <p className="font-semibold">Product not found</p>
        <p className="max-w-sm text-sm text-muted-foreground">This product may have been deleted, or the link is wrong.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/stock">Back to stock</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
