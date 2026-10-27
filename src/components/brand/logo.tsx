import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Official Herbalife artwork, taken from herbalife.com. The source files are
 * Garden Green on transparent; `tone="white"` recolours them with a CSS
 * filter for use on Evergreen and other dark surfaces.
 *
 * - /brand/herbalife-logo.png  1280 × 354  wordmark with leaf (site header)
 * - /brand/herbalife-leaf.png   192 × 214  leaf mark cropped from the above
 */

export type LogoTone = "brand" | "white";

const TONE_CLASS: Record<LogoTone, string> = {
  brand: "",
  white: "brightness-0 invert",
};

type LogoMarkProps = {
  className?: string | undefined;
  tone?: LogoTone | undefined;
  title?: string | undefined;
};

export function LogoMark({
  className,
  tone = "brand",
  title = "Herbalife",
}: LogoMarkProps) {
  return (
    <Image
      src="/brand/herbalife-leaf.png"
      alt={title}
      width={192}
      height={214}
      priority
      className={cn("h-8 w-auto shrink-0 select-none", TONE_CLASS[tone], className)}
    />
  );
}

type LogoProps = {
  className?: string | undefined;
  imageClassName?: string | undefined;
  tone?: LogoTone | undefined;
  subtitle?: string | undefined;
  title?: string | undefined;
};

export function Logo({
  className,
  imageClassName,
  tone = "brand",
  subtitle,
  title = "Herbalife",
}: LogoProps) {
  return (
    <div className={cn("flex flex-col items-start gap-1.5", className)}>
      <Image
        src="/brand/herbalife-logo.png"
        alt={title}
        width={1280}
        height={354}
        priority
        className={cn(
          "h-7 w-auto select-none",
          TONE_CLASS[tone],
          imageClassName,
        )}
      />
      {subtitle ? (
        <span className="text-eyebrow text-[0.6rem] opacity-70">{subtitle}</span>
      ) : null}
    </div>
  );
}
