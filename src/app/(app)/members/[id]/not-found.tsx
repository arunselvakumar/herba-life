import Link from "next/link";
import { UserRoundIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function MemberNotFound() {
  return (
    <Card className="ring-stone/80">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <UserRoundIcon className="size-6" />
        </span>
        <p className="font-semibold">Member not found</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          This member may have been deleted, or the link is wrong.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/members">Back to members</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
