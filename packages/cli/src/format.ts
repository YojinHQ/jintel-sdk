/**
 * Formatting helpers for CLI output.
 *
 * `printJson` / `printTable` write to stdout directly (never stderr) and never
 * add colors or escape codes, so the output is pipe-friendly.
 */

export function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export interface Column<T> {
  /** Column header. */
  header: string;
  /** Cell selector — `null`/`undefined` renders as empty cell. */
  get: (row: T) => string | number | null | undefined;
  /** Alignment of cell body (not header). Default: 'left'. */
  align?: 'left' | 'right';
}

function cellToString(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return '';
    return String(v);
  }
  return v;
}

function padCell(text: string, width: number, align: 'left' | 'right'): string {
  if (text.length >= width) return text;
  const pad = ' '.repeat(width - text.length);
  return align === 'right' ? pad + text : text + pad;
}

export function printTable<T>(rows: T[], columns: Column<T>[]): void {
  if (rows.length === 0) {
    process.stdout.write('(no results)\n');
    return;
  }

  const body: string[][] = rows.map((row) => columns.map((c) => cellToString(c.get(row))));
  const widths: number[] = columns.map((c, i) => {
    const headerLen = c.header.length;
    const maxBody = body.reduce((max, r) => Math.max(max, r[i].length), 0);
    return Math.max(headerLen, maxBody);
  });

  // Header
  const headerLine = columns.map((c, i) => padCell(c.header, widths[i], 'left')).join('  ');
  const sepLine = columns.map((_, i) => '-'.repeat(widths[i])).join('  ');
  process.stdout.write(`${headerLine}\n${sepLine}\n`);

  // Body
  for (const r of body) {
    const line = r
      .map((cell, i) => padCell(cell, widths[i], columns[i].align ?? 'left'))
      .join('  ');
    process.stdout.write(`${line}\n`);
  }
}

/** Format a number with up to 2 decimals, or empty string when null/undefined. */
export function fmtNum(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '';
  return v.toFixed(digits);
}

/** Format a percentage value (already multiplied) with a trailing %. */
export function fmtPct(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '';
  return `${v.toFixed(digits)}%`;
}
