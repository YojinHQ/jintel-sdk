import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse as parseYaml } from 'yaml';

import type { CorpusEntry } from './types.js';

const here = dirname(fileURLToPath(import.meta.url));
const CORPUS_DIR = join(here, 'corpus');

function autoDetectComparison(value: unknown, file: string): CorpusEntry['comparison'] {
  if (typeof value === 'number') {
    return { type: 'numeric_tolerance', tolerance_pct: 1.0 };
  }
  if (Array.isArray(value)) {
    return { type: 'set_overlap', threshold: 0.5 };
  }
  if (typeof value === 'string') {
    return { type: 'exact_match' };
  }
  throw new Error(`${file}: cannot auto-detect comparison for expected.value of type ${typeof value}`);
}

function validate(raw: unknown, file: string): CorpusEntry {
  if (!raw || typeof raw !== 'object') throw new Error(`${file}: not an object`);
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string') throw new Error(`${file}: missing id`);
  if (typeof r.nl_question !== 'string') throw new Error(`${file}: missing nl_question`);
  if (!r.expected || typeof r.expected !== 'object') throw new Error(`${file}: missing expected`);
  const exp = r.expected as Record<string, unknown>;
  if (exp.value === undefined) throw new Error(`${file}: expected.value missing`);
  if (typeof exp.source !== 'string') throw new Error(`${file}: expected.source missing`);

  if (r.tags === undefined || r.tags === null) {
    r.tags = [];
  } else if (!Array.isArray(r.tags) || !r.tags.every((t) => typeof t === 'string')) {
    throw new Error(`${file}: tags must be a string[]`);
  }

  if (r.comparison === undefined || r.comparison === null) {
    (r as Record<string, unknown>).comparison = autoDetectComparison(exp.value, file);
  } else {
    if (typeof r.comparison !== 'object') throw new Error(`${file}: comparison must be an object`);
    const cmp = r.comparison as Record<string, unknown>;
    if (typeof cmp.type !== 'string') throw new Error(`${file}: comparison.type missing`);
  }
  return raw as CorpusEntry;
}

export async function loadCorpus(): Promise<CorpusEntry[]> {
  const files = (await readdir(CORPUS_DIR)).filter((f) => f.endsWith('.yaml'));
  files.sort();
  const entries: CorpusEntry[] = [];
  for (const f of files) {
    const text = await readFile(join(CORPUS_DIR, f), 'utf-8');
    entries.push(validate(parseYaml(text), f));
  }
  entries.sort((a, b) => a.id.localeCompare(b.id));
  return entries;
}

export function selectQueries(all: CorpusEntry[], spec: string): CorpusEntry[] {
  const trimmed = spec.trim();
  if (trimmed === 'all') return all;
  if (/^\d+$/.test(trimmed)) {
    const n = Number(trimmed);
    return all.slice(0, n);
  }
  const ids = trimmed.split(',').map((s) => s.trim());
  const byId = new Map(all.map((e) => [e.id, e]));
  const selected: CorpusEntry[] = [];
  for (const id of ids) {
    const found = byId.get(id);
    if (!found) throw new Error(`Unknown query id: ${id}`);
    selected.push(found);
  }
  return selected;
}
