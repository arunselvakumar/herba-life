import { PERMISSION_MODULES, type Permission } from "@/lib/access/permissions";
import { cn } from "@/lib/utils";

/**
 * One chip per module showing how much of it a role unlocks: ink when every
 * action is allowed, outlined when some are, faint when none. Reads at a
 * glance in the roles table without listing thirty checkboxes.
 */
export function PermissionCoverage({ permissions, className }: { permissions: readonly Permission[]; className?: string }) {
  const set = new Set<string>(permissions);
  return (
    <ul className={cn("flex flex-wrap gap-1", className)} aria-label="Permissions by module">
      {PERMISSION_MODULES.map((mod) => {
        const allowed = mod.actions.filter((a) => set.has(`${mod.key}.${a.key}`)).length;
        const total = mod.actions.length;
        const level = allowed === 0 ? "none" : allowed === total ? "full" : "partial";
        return (
          <li
            key={mod.key}
            title={`${mod.label}: ${allowed} of ${total} allowed`}
            className={cn(
              "inline-flex h-6 items-center gap-1 rounded-full px-2 text-[0.7rem] font-semibold tabular-nums ring-1 transition-colors",
              level === "full" && "bg-primary text-primary-foreground ring-primary",
              level === "partial" && "bg-card text-foreground ring-border",
              level === "none" && "bg-transparent text-muted-foreground/60 ring-border/60 line-through decoration-muted-foreground/40",
            )}
          >
            <mod.icon className="size-3" aria-hidden />
            <span className="sr-only sm:not-sr-only">{mod.label}</span>
            {level === "partial" ? (
              <span className="text-muted-foreground">
                {allowed}/{total}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
