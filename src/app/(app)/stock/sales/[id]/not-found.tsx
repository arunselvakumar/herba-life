import Link from "next/link";
import { ReceiptTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SaleNotFound() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ReceiptTextIcon className="size-6" />
        </span>
        <p className="font-semibold">Sale not found</p>
        <p className="max-w-sm text-sm text-muted-foreground">This sale may have been removed, or the link is wrong.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/stock/sales">Back to sales</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
