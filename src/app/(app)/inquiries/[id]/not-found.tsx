import Link from "next/link";
import { MessageSquareOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function InquiryNotFound() {
  return (
    <Card className="ring-stone/80">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <MessageSquareOffIcon className="size-6" />
        </span>
        <p className="font-semibold">Inquiry not found</p>
        <p className="max-w-sm text-sm text-muted-foreground">This inquiry may have been deleted, or the link is wrong.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/inquiries">Back to inquiries</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
