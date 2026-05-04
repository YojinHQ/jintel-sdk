import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { generateMarkdown } from '../reporter/markdown.js';
import type { RunRecord } from '../types.js';

const here = dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = join(here, '..', 'reports', 'runs');
const REPORTS_DIR = join(here, '..', 'reports');

export interface ReportArgs {
  all: boolean;
}

export function parseArgs(argv: string[]): ReportArgs {
  return { all: argv.includes('--all') };
}

// sweep filenames are `sweep-YYYYMMDD-HHMMSS.jsonl` (UTC), so lexical sort = chronological.
const SWEEP_FILENAME_RE = /^sweep-\d{8}-\d{6}\.jsonl$/;
function pickFiles(allFiles: string[], includeAll: boolean): string[] {
  const sweeps = allFiles.filter((f) => SWEEP_FILENAME_RE.test(f)).sort();
  if (sweeps.length === 0) return [];
  return includeAll ? sweeps : [sweeps[sweeps.length - 1]];
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  const args = parseArgs(argv);
  const dirContents = await readdir(RUNS_DIR).catch(() => [] as string[]);
  const files = pickFiles(dirContents, args.all);
  const records: RunRecord[] = [];
  for (const f of files) {
    const text = await readFile(join(RUNS_DIR, f), 'utf-8');
    const lines = text.split('\n');
    for (let idx = 0; idx < lines.length; idx++) {
      const t = lines[idx].trim();
      if (!t) continue;
      try {
        records.push(JSON.parse(t) as RunRecord);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[report] skipping invalid JSONL ${f}:${idx + 1} (${msg})`);
      }
    }
  }

  const md = generateMarkdown(records);
  await mkdir(REPORTS_DIR, { recursive: true });
  const outFile = join(REPORTS_DIR, `${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
  await writeFile(outFile, md, 'utf-8');
  const scope = args.all ? `${files.length} sweeps` : files[0] ?? '(no sweeps found)';
  console.log(`Wrote ${outFile} from ${scope}`);
  console.log('');
  console.log(md);
}

const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
