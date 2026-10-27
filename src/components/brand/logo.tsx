import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string | undefined;
  title?: string | undefined;
};

/**
 * Tri-leaf mark in the spirit of the Herbalife brandmark: three leaves
 * growing from a single stem. Drawn as plain SVG so it inherits `currentColor`.
 */
export function LogoMark({ className, title = "Herbalife" }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-8 shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <path
        d="M24 44V22"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M24 24C24 13 17 6 6 6c0 11 7 18 18 18Z"
        fill="currentColor"
        opacity="0.55"
      />
      <path
        d="M24 24c0-11 7-18 18-18 0 11-7 18-18 18Z"
        fill="currentColor"
        opacity="0.8"
      />
      <path
        d="M24 26C24 15.5 19 9 13 4c10 2 11 12 11 22Zm0 0c0-10.5 5-17 11-22-10 2-11 12-11 22Z"
        fill="currentColor"
      />
    </svg>
  );
}

type LogoProps = {
  className?: string | undefined;
  markClassName?: string | undefined;
  wordmarkClassName?: string | undefined;
  subtitle?: string | undefined;
};

export function Logo({
  className,
  markClassName,
  wordmarkClassName,
  subtitle,
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "font-heading text-lg font-extrabold tracking-tight",
            wordmarkClassName,
          )}
        >
          HERBALIFE
        </span>
        {subtitle ? (
          <span className="text-eyebrow mt-1 text-[0.6rem] opacity-70">
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
}
