import { cn } from "@/lib/utils";
import { fullName, initials } from "@/lib/members/format";

/** Initials in a brand-green circle; the kiosk and the attendance log use it to make names scannable. */
export function MemberAvatar({
  member,
  className,
}: {
  member: { firstName: string; lastName: string };
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 font-heading text-sm font-extrabold text-brand-700",
        className,
      )}
    >
      {initials(fullName(member))}
    </span>
  );
}
