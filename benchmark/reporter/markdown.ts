import type { RunRecord } from '../types.js';

interface CellAgg {
  count: number;
  passes: number;
  totalTokens: number[];
  toolCalls: number[];
  latencies: number[];
  thinkingMs: number[];
  toolMs: number[];
  peakContext: number[];
  credits: number[]; // only populated for variants whose runs report credits
  // FinToolBench-style tool-use metrics
  runsWithTools: number; // numerator for TIR
  toolCallsTotal: number; // denominator for TESR
  toolCallsSuccess: number; // numerator for TESR
  runsWithToolsNoError: number; // numerator for CER
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

export function generateMarkdown(records: RunRecord[]): string {
  if (records.length === 0) {
    return '# Jintel Benchmark Report\n\nNo runs found.\n';
  }

  const cells = new Map<string, CellAgg>();
  for (const r of records) {
    const key = `${r.model_id}|${r.variant_id}`;
    const agg = cells.get(key) ?? {
      count: 0,
      passes: 0,
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
    agg.count++;
    if (r.grade.pass) agg.passes++;
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

    cells.set(key, agg);
  }

  const fmtPct = (num: number, denom: number): string => (denom === 0 ? 'n/a' : `${((num / denom) * 100).toFixed(1)}%`);
  const sortedKeys = [...cells.keys()].sort();

  const lines: string[] = [];
  lines.push('# Jintel Benchmark Report');
  lines.push('');
  lines.push(`Records: ${records.length}`);
  lines.push('');

  // -- Accuracy ---------------------------------------------------------
  lines.push('## Accuracy');
  lines.push('');
  lines.push('| model | variant | n | pass |');
  lines.push('|---|---|---|---|');
  for (const key of sortedKeys) {
    const agg = cells.get(key)!;
    const [model, variant] = key.split('|');
    const passRate = ((agg.passes / agg.count) * 100).toFixed(1);
    lines.push(`| ${model} | ${variant} | ${agg.count} | ${passRate}% |`);
  }
  lines.push('');

  // -- Cost -------------------------------------------------------------
  lines.push('## Cost');
  lines.push('');
  lines.push('| model | variant | mean tokens | mean peak ctx | mean credits |');
  lines.push('|---|---|---|---|---|');
  for (const key of sortedKeys) {
    const agg = cells.get(key)!;
    const [model, variant] = key.split('|');
    const meanTokens = mean(agg.totalTokens).toFixed(0);
    const meanPeakCtx = mean(agg.peakContext).toFixed(0);
    const meanCredits = agg.credits.length === 0 ? 'n/a' : mean(agg.credits).toFixed(1);
    lines.push(`| ${model} | ${variant} | ${meanTokens} | ${meanPeakCtx} | ${meanCredits} |`);
  }
  lines.push('');
  lines.push('- **mean tokens** — input + output across all turns, averaged across runs');
  lines.push(
    '- **mean peak ctx** — peak tokens loaded into the model context per turn ' +
      '(input + cache_read + cache_creation; includes cached system prompts and ' +
      'server-side tool payloads such as web_search results)',
  );
  lines.push('- **mean credits** — Jintel credits drained per run (n/a for variants with no Jintel upstream)');
  lines.push('');

  // -- Tool use ---------------------------------------------------------
  lines.push('## Tool use');
  lines.push('');
  lines.push('| model | variant | mean tool calls | TIR | TESR | CER |');
  lines.push('|---|---|---|---|---|---|');
  for (const key of sortedKeys) {
    const agg = cells.get(key)!;
    const [model, variant] = key.split('|');
    const meanCalls = mean(agg.toolCalls).toFixed(2);
    const tir = fmtPct(agg.runsWithTools, agg.count);
    const tesr = fmtPct(agg.toolCallsSuccess, agg.toolCallsTotal);
    const cer = fmtPct(agg.runsWithToolsNoError, agg.runsWithTools);
    lines.push(`| ${model} | ${variant} | ${meanCalls} | ${tir} | ${tesr} | ${cer} |`);
  }
  lines.push('');
  lines.push('- **TIR** — Tool Invocation Rate: % of runs that invoked ≥1 tool');
  lines.push('- **TESR** — Tool Execution Success Rate: % of tool calls without error');
  lines.push('- **CER** — Conditional Execution Rate: % of tool-using runs whose calls all succeeded');
  lines.push('');

  // -- Latency ----------------------------------------------------------
  lines.push('## Latency');
  lines.push('');
  lines.push('| model | variant | p50 ms | p95 ms | mean think ms | mean tool ms |');
  lines.push('|---|---|---|---|---|---|');
  for (const key of sortedKeys) {
    const agg = cells.get(key)!;
    const [model, variant] = key.split('|');
    const sortedLat = [...agg.latencies].sort((a, b) => a - b);
    const p50 = quantile(sortedLat, 0.5).toFixed(0);
    const p95 = quantile(sortedLat, 0.95).toFixed(0);
    const meanThink = mean(agg.thinkingMs).toFixed(0);
    const meanToolMs = mean(agg.toolMs).toFixed(0);
    lines.push(`| ${model} | ${variant} | ${p50} | ${p95} | ${meanThink} | ${meanToolMs} |`);
  }
  lines.push('');
  lines.push('- **p50 / p95 ms** — wall-clock latency from agent start to final answer');
  lines.push('- **mean think ms / mean tool ms** — split: model thinking vs sum of tool round-trips per run');
  lines.push('');
  return lines.join('\n');
}
