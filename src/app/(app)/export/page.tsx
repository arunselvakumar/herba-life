import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { DatabaseBackupIcon, LockKeyholeIcon } from "lucide-react";
import { ExportButton } from "@/components/app/export-button";
import { PageHeader, PageHeaderSkeleton } from "@/components/members/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { countExportRows } from "@/lib/export/build";
import { EVERYTHING_KEY, EXPORTS, exportableModules, type ExportKey } from "@/lib/export/catalog";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Backup & export",
};

export default function ExportPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeaderSkeleton />
          <GridSkeleton />
        </>
      }
    >
      <Exports />
    </Suspense>
  );
}

/**
 * One place to take the branch's data out of the console: a workbook per
 * module, or everything in one file. Each card lists the sheets the workbook
 * holds with how many rows are in them right now.
 */
async function Exports() {
  const user = await getCurrentUser();
  const modules = exportableModules(user);

  return (
    <>
      <PageHeader
        eyebrow="Data"
        title="Backup & export"
        description="Download the branch's records as Excel workbooks: for a backup, for reporting, or to move to another system. Every workbook opens with an About sheet saying what is in it."
        actions={modules.length > 0 ? <ExportButton module={EVERYTHING_KEY} label="Download everything" variant="default" /> : undefined}
      />
      <Suspense fallback={<GridSkeleton />}>
        <ExportGrid allowed={modules.map((m) => m.key)} />
      </Suspense>
    </>
  );
}

async function ExportGrid({ allowed }: { allowed: readonly string[] }) {
  await connection();
  const counts = await countExportRows();
  const formatter = new Intl.NumberFormat("en-IN");

  if (allowed.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-foreground">
            <LockKeyholeIcon className="size-5" />
          </span>
          <p className="font-semibold">Nothing to export</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Your role does not include “Export to Excel” for any module. Ask an administrator to add it to your role.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section aria-label="Exports" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {EXPORTS.filter((def) => allowed.includes(def.key)).map((def) => (
        <Card key={def.key} className="flex flex-col">
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                <def.icon className="size-4" />
              </span>
              <div className="space-y-1">
                <CardTitle className="text-base font-bold">{def.label}</CardTitle>
                <CardDescription>{def.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="mt-auto space-y-4">
            <ul className="flex flex-wrap gap-1.5" aria-label={`Sheets in the ${def.label} workbook`}>
              {def.sheets.map((sheet) => (
                <li
                  key={sheet}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                >
                  {sheet}
                  <span className="font-semibold tabular-nums text-foreground">{formatter.format(counts[sheet] ?? 0)}</span>
                </li>
              ))}
            </ul>
            <ExportButton module={def.key as ExportKey} label={`Download ${def.label.toLowerCase()}`} size="default" />
          </CardContent>
        </Card>
      ))}
      <Card className="flex flex-col border-dashed bg-card/60 md:col-span-2 xl:col-span-1">
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <DatabaseBackupIcon className="size-4" />
            </span>
            <div className="space-y-1">
              <CardTitle className="text-base font-bold">Everything</CardTitle>
              <CardDescription>
                Every workbook above in one file, one sheet per table. This is the file to keep as a backup or hand to another system.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-auto">
          <ExportButton module={EVERYTHING_KEY} label="Download everything" variant="default" size="default" />
        </CardContent>
      </Card>
    </section>
  );
}

function GridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-56 rounded-3xl" />
      ))}
    </div>
  );
}
