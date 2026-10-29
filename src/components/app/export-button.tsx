import { FileSpreadsheetIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { EVERYTHING_KEY, exportHref, type ExportKey } from "@/lib/export/catalog";
import type { VariantProps } from "class-variance-authority";

/**
 * "Export to Excel": a plain link to the export route, so the browser treats
 * the response as a download instead of a navigation. Pages render it only
 * when the role holds the module's export permission.
 */
export function ExportButton({
  module,
  params,
  label = "Export",
  variant = "outline",
  size = "lg",
  className,
}: {
  module: ExportKey | typeof EVERYTHING_KEY;
  /** Query parameters for the route, for example `{ member: id }`. */
  params?: Record<string, string>;
  label?: string;
  className?: string;
} & Pick<VariantProps<typeof buttonVariants>, "variant" | "size">) {
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a href={exportHref(module, params)} download title="Download as an Excel workbook">
        <FileSpreadsheetIcon data-icon="inline-start" />
        {label}
      </a>
    </Button>
  );
}
