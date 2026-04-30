import 'dotenv/config';

import { mkdir, appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';

import { loadCorpus, selectQueries } from '../corpus-loader.js';
import { pickEnv } from '../env.js';
import { runQuery } from '../runners/anthropic.js';
import { createNoneAdapter } from '../adapters/none.js';
import { createAnthropicWebSearchAdapter } from '../adapters/anthropic-web-search.js';
import { createJintelMcpAdapter } from '../adapters/jintel-mcp.js';
import { createJintelCliAdapter } from '../adapters/jintel-cli.js';
import { extract } from '../grader/extract.js';
import { compare } from '../grader/compare.js';
import { createCreditClient, diffSnapshots } from '../credits.js';
import type { CreditClient } from '../credits.js';
import type { Adapter } from '../adapters/types.js';
import type { VariantId, RunRecord } from '../types.js';

const here = dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = join(here, '..', 'reports', 'runs');

const DEFAULT_JINTEL_BASE_URL = 'https://api.jintel.ai/api';

// Set once so subprocess env forwarding (jintel-mcp, jintel-cli) and the
// credit client all see the same value.
if (!process.env.JINTEL_BASE_URL) process.env.JINTEL_BASE_URL = DEFAULT_JINTEL_BASE_URL;

// Override with BENCH_INTER_QUERY_DELAY_MS_<VARIANT> (uppercase, hyphens → underscores)
// or a global BENCH_INTER_QUERY_DELAY_MS.
const INTER_QUERY_DELAY_DEFAULTS: Record<VariantId, number> = {
  bare: 1000,
  'anthropic-web-search': 8000,
  'jintel-mcp': 3000,
  'jintel-cli': 3000,
};

function interQueryDelayMs(variant: VariantId): number {
  const envKey = `BENCH_INTER_QUERY_DELAY_MS_${variant.replace(/-/g, '_').toUpperCase()}`;
  const fallback = INTER_QUERY_DELAY_DEFAULTS[variant];
  const parse = (v: string | undefined): number | null => {
    if (v === undefined) return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) {
      console.warn(`[bench] ignoring invalid delay value "${v}"`);
      return null;
    }
    return n;
  };
  return parse(process.env[envKey]) ?? parse(process.env.BENCH_INTER_QUERY_DELAY_MS) ?? fallback;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface BenchArgs {
  model: string;
  queries: string;
  variant: string;
}

export function parseArgs(argv: string[]): BenchArgs {
  const out: Partial<BenchArgs> = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const next = argv[i + 1];
    if (flag === '--model') {
      out.model = next;
      i++;
    } else if (flag === '--queries') {
      out.queries = next;
      i++;
    } else if (flag === '--variant') {
      out.variant = next;
      i++;
    }
  }
  if (!out.model) throw new Error('--model is required');
  return {
    model: out.model,
    queries: out.queries ?? 'all',
    variant: out.variant ?? 'all',
  };
}

// Used for JINTEL_MCP_ARGS so values can contain spaces.
export function splitShellArgs(input: string): string[] {
  const out: string[] = [];
  let buf = '';
  let quote: '"' | "'" | null = null;
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (quote) {
      if (ch === '\\' && quote === '"' && i + 1 < input.length) {
        buf += input[i + 1];
        i += 2;
        continue;
      }
      if (ch === quote) {
        quote = null;
        i++;
        continue;
      }
      buf += ch;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      i++;
      continue;
    }
    if (ch === '\\' && i + 1 < input.length) {
      buf += input[i + 1];
      i += 2;
      continue;
    }
    if (/\s/.test(ch)) {
      if (buf.length > 0) {
        out.push(buf);
        buf = '';
      }
      i++;
      continue;
    }
    buf += ch;
    i++;
  }
  if (buf.length > 0) out.push(buf);
  return out;
}

async function buildAdapter(variant: VariantId): Promise<Adapter> {
  if (variant === 'bare') return createNoneAdapter();
  if (variant === 'anthropic-web-search') return createAnthropicWebSearchAdapter();
  if (variant === 'jintel-mcp') {
    const command = process.env.JINTEL_MCP_COMMAND ?? 'npx';
    const args = process.env.JINTEL_MCP_ARGS
      ? splitShellArgs(process.env.JINTEL_MCP_ARGS)
      : ['-y', '@yojinhq/jintel-mcp'];
    const env = pickEnv([
      'JINTEL_API_KEY',
      'JINTEL_WALLET_PRIVATE_KEY',
      'JINTEL_BASE_URL',
      'JINTEL_X402_MAX_VALUE',
      'PATH',
      'HOME',
    ]);
    return createJintelMcpAdapter({ command, args, env });
  }
  if (variant === 'jintel-cli') {
    return createJintelCliAdapter({});
  }
  throw new Error(`Unknown variant: ${variant}`);
}

function selectVariants(spec: string): VariantId[] {
  if (spec === 'all') return ['bare', 'anthropic-web-search', 'jintel-mcp', 'jintel-cli'];
  if (spec === 'bare' || spec === 'anthropic-web-search' || spec === 'jintel-mcp' || spec === 'jintel-cli')
    return [spec];
  throw new Error(`Unknown variant: ${spec}`);
}

// Variants that draw on Jintel credits and therefore want a snapshot diff.
function variantBillsCredits(variant: VariantId): boolean {
  return variant === 'jintel-mcp' || variant === 'jintel-cli';
}

function buildCreditClient(): CreditClient | null {
  const apiKey = process.env.JINTEL_API_KEY;
  if (!apiKey) return null;
  // Credit endpoints (`/api/v1/me`, `/api/v1/credits/balance`) are absolute from
  // the host root. JINTEL_BASE_URL may include `/api` (the GraphQL prefix); strip
  // it so we don't double up to `/api/api/v1/...`.
  const host = (process.env.JINTEL_BASE_URL ?? DEFAULT_JINTEL_BASE_URL).replace(/\/$/, '').replace(/\/api$/, '');
  return createCreditClient({ baseUrl: host, apiKey });
}

function gitSha(path: string): string {
  try {
    return execSync(`git log -n 1 --format=%H -- "${path}"`, { encoding: 'utf-8' }).trim() || 'unknown';
  } catch {
    return 'unknown';
  }
}

async function appendRecord(file: string, record: RunRecord) {
  await mkdir(dirname(file), { recursive: true });
  await appendFile(file, JSON.stringify(record) + '\n', 'utf-8');
}

function sweepId(): string {
  // YYYYMMDD-HHMMSS in UTC — sorts lexically, no separators in path.
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  const args = parseArgs(argv);
  const corpus = await loadCorpus();
  const queries = selectQueries(corpus, args.queries);
  const variants = selectVariants(args.variant);
  const sweepFile = join(RUNS_DIR, `sweep-${sweepId()}.jsonl`);

  const corpusVersion = gitSha('benchmark/corpus');
  const jintelSha = gitSha('.');

  console.log(
    `Running model=${args.model} variants=${variants.join(',')} queries=${queries.length} (${queries.map((q) => q.id).join(',')})`,
  );
  console.log(`Writing to ${sweepFile}`);

  for (const variant of variants) {
    let adapter: Adapter;
    try {
      adapter = await buildAdapter(variant);
    } catch (err) {
      console.warn(`[skip] ${variant}: ${(err as Error).message}`);
      continue;
    }
    const creditClient = variantBillsCredits(variant) ? buildCreditClient() : null;
    if (variantBillsCredits(variant) && !creditClient) {
      console.warn(`[credits] JINTEL_API_KEY not set — credit usage will not be measured for ${variant}`);
    }
    try {
      const variantDelayMs = interQueryDelayMs(variant);
      let queryIdx = 0;
      for (const query of queries) {
        // Space out calls to ease per-minute burst caps on the OAuth path.
        if (queryIdx > 0) await sleep(variantDelayMs);
        queryIdx++;
        console.log(`  ${variant} / ${query.id} ...`);
        const before = creditClient ? await creditClient.read() : null;
        const ungraded = await runQuery({
          model: args.model,
          adapter,
          query,
          params: { max_tokens: 1024 },
          corpusVersion,
          jintelSha,
        });
        const after = creditClient ? await creditClient.read() : null;
        const credits = creditClient ? diffSnapshots(before, after) : null;

        const extraction = extract(ungraded.transcript);
        const cmp = compare(extraction.value, {
          type: query.comparison.type,
          value: query.expected.value,
          tolerance_pct: query.comparison.tolerance_pct,
          threshold: query.comparison.threshold,
          precision_threshold: query.comparison.precision_threshold,
          recall_threshold: query.comparison.recall_threshold,
          fields: query.comparison.fields,
        });
        const record: RunRecord = {
          ...ungraded,
          ...(credits ? { credits } : {}),
          extracted_answer: extraction.value,
          extraction_path: extraction.path,
          grade: { pass: cmp.pass, comparison_rule: cmp.rule, diff: cmp.diff },
        };
        await appendRecord(sweepFile, record);
        const creditStr = credits ? `, ${credits.charged} credits` : '';
        console.log(
          `    ${cmp.pass ? 'PASS' : 'FAIL'} (${record.timing.total_ms}ms, ${record.tokens.input + record.tokens.output} tokens${creditStr})`,
        );
      }
    } finally {
      if (adapter.close) {
        try {
          await adapter.close();
        } catch (err) {
          console.warn(`[close] ${variant}: ${(err as Error).message}`);
        }
      }
    }
  }
}

const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
