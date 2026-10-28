import { FlagIcon, MessageCircleIcon, NotebookPenIcon, PhoneIcon, Trash2Icon, type LucideIcon } from "lucide-react";
import { DoorOpenIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmAction } from "@/components/members/confirm-action";
import type { InquiryActivity } from "@/db/schema";
import { deleteActivity } from "@/lib/inquiries/actions";
import { ACTIVITY_LABELS } from "@/lib/inquiries/constants";
import { formatDay } from "@/lib/members/dates";
import { cn } from "@/lib/utils";

const icons: Record<InquiryActivity["type"], LucideIcon> = {
  call: PhoneIcon,
  whatsapp: MessageCircleIcon,
  visit: DoorOpenIcon,
  note: NotebookPenIcon,
  status: FlagIcon,
};

export function ActivityList({
  inquiryId,
  activities,
}: {
  inquiryId: string;
  activities: (InquiryActivity & { recordedByUser: { name: string } | null })[];
}) {
  return (
    <Card className="ring-stone/80">
      <CardHeader>
        <CardTitle className="text-base font-bold">Follow-up log</CardTitle>
        <CardDescription>
          {activities.length === 0 ? "Nothing logged yet." : `${activities.length} entr${activities.length === 1 ? "y" : "ies"}, newest first`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Log the first call or visit above.
          </p>
        ) : (
          <ol className="space-y-1">
            {activities.map((a) => {
              const Icon = icons[a.type];
              const system = a.type === "status";
              return (
                <li key={a.id} className="group flex gap-3 rounded-lg px-2 py-2.5 hover:bg-linen/60">
                  <span
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                      system ? "bg-muted text-muted-foreground" : "bg-brand-100 text-brand-700",
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <span className="font-semibold">{ACTIVITY_LABELS[a.type]}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDay(a.occurredOn)}
                        {a.recordedByUser ? ` · ${a.recordedByUser.name}` : ""}
                      </span>
                    </div>
                    {a.notes ? <p className="whitespace-pre-wrap text-sm text-muted-foreground">{a.notes}</p> : null}
                  </div>
                  {!system ? (
                    <ConfirmAction
                      action={deleteActivity.bind(null, inquiryId, a.id)}
                      title="Delete this entry?"
                      confirmLabel="Delete"
                      destructive
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <Trash2Icon />
                      <span className="sr-only">Delete entry</span>
                    </ConfirmAction>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
