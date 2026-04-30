import type { RunRecord } from '../types.js';

interface CellAgg {
  count: number;
  passes: number;
  truncated: number;
  totalTokens: number[];
  toolCalls: number[];
  latencies: number[];
  thinkingMs: number[];
  toolMs: number[];
  peakContext: number[];
  credits: number[];
  // FinToolBench-style tool-use metrics
  runsWithTools: number;
  toolCallsTotal: number;
  toolCallsSuccess: number;
  runsWithToolsNoError: number;
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function fmtPct(num: number, denom: number): string {
  return denom === 0 ? 'n/a' : `${((num / denom) * 100).toFixed(1)}%`;
}

function newAgg(): CellAgg {
  return {
    count: 0,
    passes: 0,
    truncated: 0,
    totalTokens: [],
    toolCalls: [],
    latencies: [],
    thinkingMs: [],
    toolMs: [],
    peakContext: [],
    credits: [],
    runsWithTools: 0,
    toolCallsTotal: 0,
    toolCallsSuccess: 0,
    runsWithToolsNoError: 0,
  };
}

function ingest(agg: CellAgg, r: RunRecord): void {
  agg.count++;
  if (r.grade.pass) agg.passes++;
  if (r.truncated) agg.truncated++;
  agg.totalTokens.push(r.tokens.input + r.tokens.output);
  agg.toolCalls.push(r.tool_calls.length);
  agg.latencies.push(r.timing.total_ms);
  agg.thinkingMs.push(r.timing.model_thinking_ms);
  agg.toolMs.push(r.timing.tool_round_trip_ms);
  agg.peakContext.push(r.tokens.peak_context);
  if (r.credits) agg.credits.push(r.credits.charged);

  if (r.tool_calls.length > 0) {
    agg.runsWithTools++;
    agg.toolCallsTotal += r.tool_calls.length;
    const successes = r.tool_calls.filter((c) => !c.error).length;
    agg.toolCallsSuccess += successes;
    if (successes === r.tool_calls.length) agg.runsWithToolsNoError++;
  }
}

type RowFn = (agg: CellAgg, model: string, variant: string) => string;

function renderSection(
  title: string,
  headers: string[],
  sortedKeys: string[],
  cells: Map<string, CellAgg>,
  row: RowFn,
  legend: string[] = [],
): string[] {
  const out: string[] = [`## ${title}`, ''];
  out.push(`| ${headers.join(' | ')} |`);
  out.push(`|${headers.map(() => '---').join('|')}|`);
  for (const key of sortedKeys) {
    const [model, variant] = key.split('|');
    out.push(row(cells.get(key)!, model, variant));
  }
  out.push('');
  for (const item of legend) out.push(item);
  if (legend.length > 0) out.push('');
  return out;
}

export function generateMarkdown(records: RunRecord[]): string {
  if (records.length === 0) {
    return '# Jintel Benchmark Report\n\nNo runs found.\n';
  }

  const cells = new Map<string, CellAgg>();
  for (const r of records) {
    const key = `${r.model_id}|${r.variant_id}`;
    const agg = cells.get(key) ?? newAgg();
    ingest(agg, r);
    cells.set(key, agg);
  }

  const sortedKeys = [...cells.keys()].sort();

  const lines: string[] = ['# Jintel Benchmark Report', '', `Records: ${records.length}`, ''];

  const showTruncated = [...cells.values()].some((a) => a.truncated > 0);

  lines.push(
    ...renderSection(
      'Accuracy',
      ['model', 'variant', 'n', 'pass', ...(showTruncated ? ['truncated'] : [])],
      sortedKeys,
      cells,
      (agg, model, variant) => {
        const passRate = ((agg.passes / agg.count) * 100).toFixed(1);
        const cols = [model, variant, agg.count, `${passRate}%`];
        if (showTruncated) cols.push(`${agg.truncated}/${agg.count}`);
        return `| ${cols.join(' | ')} |`;
      },
      showTruncated
        ? ['- **truncated** — hit `MAX_AGENT_TURNS` mid-tool_use; scored as fail but harness-caused, not model.']
        : [],
    ),
  );

  lines.push(
    ...renderSection(
      'Cost',
      ['model', 'variant', 'mean tokens', 'mean peak ctx', 'mean credits'],
      sortedKeys,
      cells,
      (agg, model, variant) => {
        const meanTokens = mean(agg.totalTokens).toFixed(0);
        const meanPeakCtx = mean(agg.peakContext).toFixed(0);
        const meanCredits = agg.credits.length === 0 ? 'n/a' : mean(agg.credits).toFixed(1);
        return `| ${model} | ${variant} | ${meanTokens} | ${meanPeakCtx} | ${meanCredits} |`;
      },
      [
        '- **mean tokens** — input + output across all turns, averaged across runs',
        '- **mean peak ctx** — peak tokens loaded into the model context per turn ' +
          '(input + cache_read + cache_creation; includes cached system prompts and ' +
          'server-side tool payloads such as web_search results)',
        '- **mean credits** — Jintel credits drained per run (n/a for variants with no Jintel upstream)',
      ],
    ),
  );

  lines.push(
    ...renderSection(
      'Tool use',
      ['model', 'variant', 'mean tool calls', 'TIR', 'TESR', 'CER'],
      sortedKeys,
      cells,
      (agg, model, variant) => {
        const meanCalls = mean(agg.toolCalls).toFixed(2);
        const tir = fmtPct(agg.runsWithTools, agg.count);
        const tesr = fmtPct(agg.toolCallsSuccess, agg.toolCallsTotal);
        const cer = fmtPct(agg.runsWithToolsNoError, agg.runsWithTools);
        return `| ${model} | ${variant} | ${meanCalls} | ${tir} | ${tesr} | ${cer} |`;
      },
      [
        '- **TIR** — Tool Invocation Rate: % of runs that invoked ≥1 tool',
        '- **TESR** — Tool Execution Success Rate: % of tool calls without error',
        '- **CER** — Conditional Execution Rate: % of tool-using runs whose calls all succeeded',
      ],
    ),
  );

  lines.push(
    ...renderSection(
      'Latency',
      ['model', 'variant', 'p50 ms', 'p95 ms', 'mean think ms', 'mean tool ms'],
      sortedKeys,
      cells,
      (agg, model, variant) => {
        const sortedLat = [...agg.latencies].sort((a, b) => a - b);
        const p50 = quantile(sortedLat, 0.5).toFixed(0);
        const p95 = quantile(sortedLat, 0.95).toFixed(0);
        const meanThink = mean(agg.thinkingMs).toFixed(0);
        const meanToolMs = mean(agg.toolMs).toFixed(0);
        return `| ${model} | ${variant} | ${p50} | ${p95} | ${meanThink} | ${meanToolMs} |`;
      },
      [
        '- **p50 / p95 ms** — wall-clock latency from agent start to final answer',
        '- **mean think ms / mean tool ms** — split: model thinking vs sum of tool round-trips per run',
      ],
    ),
  );

  return lines.join('\n');
}
