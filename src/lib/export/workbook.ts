import "server-only";

import ExcelJS from "exceljs";

/**
 * A thin layer over ExcelJS so every export looks the same: a bold header
 * row that stays put when scrolling, a filter on every column, sensible
 * widths, dates stored as real Excel dates and money with two decimals.
 *
 * A sheet is described by its columns; each column knows how to pull a
 * value out of a row and what kind of value that is. The kind decides the
 * number format, so "Joined on" sorts and filters as a date in Excel rather
 * than as text.
 */

export type CellKind = "text" | "number" | "money" | "date" | "datetime" | "bool";

export type Column<Row> = {
  header: string;
  kind?: CellKind;
  /** Characters; defaults by kind. */
  width?: number;
  get: (row: Row) => string | number | boolean | Date | null | undefined;
};

export type SheetSpec<Row = unknown> = {
  /** Unique within a workbook. Excel limits names to 31 characters. */
  name: string;
  /** One line under the title in the About sheet. */
  description: string;
  columns: readonly Column<Row>[];
  rows: readonly Row[];
};

export type ExportMeta = {
  title: string;
  exportedBy: string;
  exportedAt: Date;
  /** Extra notes for the About sheet, one per line. */
  notes?: readonly string[];
};

const DEFAULT_WIDTH: Record<CellKind, number> = {
  text: 18,
  number: 10,
  money: 12,
  date: 13,
  datetime: 18,
  bool: 8,
};

const NUM_FMT: Partial<Record<CellKind, string>> = {
  money: "#,##0.00",
  date: "dd-mmm-yyyy",
  datetime: "dd-mmm-yyyy hh:mm",
};

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF111111" } };
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" } };

/**
 * ExcelJS writes a JS Date using its UTC components, so a check-in at
 * 9:14 am branch time would show as 3:44 am. Rebuilding the date from the
 * server's local components keeps the spreadsheet on branch time, which is
 * what every screen in the console shows.
 */
export function localAsUtc(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()),
  );
}

/** `YYYY-MM-DD` (how Postgres `date` columns round-trip) → an Excel date with no time part. */
export function dayAsDate(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

function toCell(value: ReturnType<Column<unknown>["get"]>, kind: CellKind): ExcelJS.CellValue {
  if (value === null || value === undefined || value === "") return null;
  switch (kind) {
    case "bool":
      return value ? "Yes" : "No";
    case "date":
      return typeof value === "string" ? dayAsDate(value) : value instanceof Date ? localAsUtc(value) : String(value);
    case "datetime":
      return value instanceof Date ? localAsUtc(value) : typeof value === "string" ? dayAsDate(value) : String(value);
    case "number":
    case "money":
      return typeof value === "number" ? value : Number(value);
    default:
      return typeof value === "boolean" ? (value ? "Yes" : "No") : value instanceof Date ? localAsUtc(value) : value;
  }
}

export function createWorkbook(meta: ExportMeta): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = meta.exportedBy;
  workbook.lastModifiedBy = meta.exportedBy;
  workbook.created = meta.exportedAt;
  workbook.modified = meta.exportedAt;
  workbook.title = meta.title;
  return workbook;
}

export function addSheet<Row>(workbook: ExcelJS.Workbook, spec: SheetSpec<Row>): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(spec.name, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = spec.columns.map((column): Partial<ExcelJS.Column> => {
    const kind = column.kind ?? "text";
    const numFmt = NUM_FMT[kind];
    return {
      header: column.header,
      width: column.width ?? DEFAULT_WIDTH[kind],
      ...(numFmt ? { style: { numFmt } } : {}),
    };
  });

  for (const row of spec.rows) {
    sheet.addRow(spec.columns.map((column) => toCell(column.get(row), column.kind ?? "text")));
  }

  const header = sheet.getRow(1);
  header.font = HEADER_FONT;
  header.fill = HEADER_FILL;
  header.alignment = { vertical: "middle" };
  header.height = 22;
  if (spec.columns.length > 0) {
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, spec.rows.length + 1), column: spec.columns.length } };
  }
  return sheet;
}

/**
 * The first sheet of every workbook: what this file is, who made it and
 * when, and a row per data sheet with its count. Handy when the file turns
 * up in someone's inbox months later.
 */
export function addAboutSheet(workbook: ExcelJS.Workbook, meta: ExportMeta, sheets: readonly SheetSpec[]): void {
  const sheet = workbook.addWorksheet("About");
  sheet.columns = [{ width: 22 }, { width: 70 }];

  const title = sheet.addRow([meta.title]);
  title.font = { bold: true, size: 16 };
  sheet.addRow([]);
  sheet.addRow(["Exported on", localAsUtc(meta.exportedAt)]).getCell(2).numFmt = "dddd, dd mmmm yyyy hh:mm";
  sheet.addRow(["Exported by", meta.exportedBy]);
  sheet.addRow(["Application", "Herbalife Internal"]);
  sheet.addRow([]);

  const head = sheet.addRow(["Sheet", "Contents"]);
  head.font = HEADER_FONT;
  head.fill = HEADER_FILL;
  for (const spec of sheets) {
    const count = spec.rows.length;
    sheet.addRow([spec.name, `${count} row${count === 1 ? "" : "s"} · ${spec.description}`]);
  }

  sheet.addRow([]);
  const notes = [
    "Dates and times are in the branch's local time.",
    "Columns ending in “ID” are internal identifiers. They let you match rows across sheets (a member's packages, follow-ups and check-ins carry the Member ID).",
    "Empty cells mean the value was never recorded.",
    ...(meta.notes ?? []),
  ];
  const notesHead = sheet.addRow(["Notes"]);
  notesHead.font = { bold: true };
  for (const note of notes) {
    const row = sheet.addRow(["", note]);
    row.getCell(2).alignment = { wrapText: true, vertical: "top" };
  }
}

export async function toBuffer(workbook: ExcelJS.Workbook): Promise<Uint8Array<ArrayBuffer>> {
  // ExcelJS hands back a Node Buffer; copying it into a fresh Uint8Array gives
  // the Response constructor a plain ArrayBuffer-backed view.
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer as unknown as Uint8Array);
}
