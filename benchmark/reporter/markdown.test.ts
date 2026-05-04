import { describe, it, expect } from 'vitest';
import { generateMarkdown } from './markdown.js';
import type { RunRecord } from '../types.js';

function r(overrides: Partial<RunRecord> = {}): RunRecord {
  return {
    run_id: 'x',
    timestamp: '2026-04-27T00:00:00Z',
    corpus_version: 'a',
    jintel_sha: 'b',
    model_id: 'claude-haiku-4-5',
    variant_id: 'bare',
    query_id: 'q-001',
    nl_question: 'q',
    system_prompt_hash: 'h',
    params: { temperature: 0, max_tokens: 1024 },
    transcript: [],
    tokens: { input: 100, output: 50, peak_context: 100, per_turn: [] },
    tool_calls: [],
    timing: { total_ms: 1000, model_thinking_ms: 1000, tool_round_trip_ms: 0 },
    extracted_answer: null,
    extraction_path: 'failed',
    grade: { pass: true, comparison_rule: 'exact_match', diff: null },
    errors: [],
    ...overrides,
  };
}

describe('reporter', () => {
  it('groups by (model, variant) and counts pass rate', () => {
    const records = [
      r({ grade: { pass: true, comparison_rule: 'exact_match', diff: null } }),
      r({ grade: { pass: false, comparison_rule: 'exact_match', diff: null } }),
      r({ variant_id: 'jintel-mcp', grade: { pass: true, comparison_rule: 'exact_match', diff: null } }),
    ];
    const md = generateMarkdown(records);
    expect(md).toMatch(/claude-haiku-4-5/);
    expect(md).toMatch(/bare/);
    expect(md).toMatch(/jintel-mcp/);
    expect(md).toMatch(/50%|50.0%/); // bare 1/2
    expect(md).toMatch(/100%|100.0%/); // jintel-mcp 1/1
  });

  it('includes mean tokens, mean tool calls, p50/p95 latency per cell', () => {
    const records = [
      r({
        tokens: { input: 100, output: 50, peak_context: 100, per_turn: [] },
        timing: { total_ms: 1000, model_thinking_ms: 1000, tool_round_trip_ms: 0 },
      }),
      r({
        tokens: { input: 200, output: 100, peak_context: 200, per_turn: [] },
        timing: { total_ms: 3000, model_thinking_ms: 3000, tool_round_trip_ms: 0 },
      }),
    ];
    const md = generateMarkdown(records);
    expect(md).toMatch(/225/); // mean of (150, 300) = 225 total tokens
    expect(md).toMatch(/p50|p95/i);
  });

  it('reports zero records gracefully', () => {
    const md = generateMarkdown([]);
    expect(md).toMatch(/no runs/i);
  });

  it('reports mean credits per cell when records carry credits', () => {
    const records = [
      r({
        variant_id: 'jintel-mcp',
        credits: { charged: 10, fromPlan: 10, fromTopup: 0 },
      }),
      r({
        variant_id: 'jintel-mcp',
        query_id: 'q-002',
        credits: { charged: 30, fromPlan: 20, fromTopup: 10 },
      }),
    ];
    const md = generateMarkdown(records);
    // mean(10, 30) = 20.0
    expect(md).toMatch(/20\.0/);
    expect(md).toMatch(/mean credits/);
  });

  it('reports n/a for mean credits in cells without credit data (bare/web-search)', () => {
    const records = [r({ variant_id: 'bare' })];
    const md = generateMarkdown(records);
    expect(md).toMatch(/n\/a/);
  });

  it('reports peak context and latency breakdown per cell', () => {
    const records = [
      r({
        tokens: { input: 100, output: 50, peak_context: 1500, per_turn: [] },
        timing: { total_ms: 1000, model_thinking_ms: 700, tool_round_trip_ms: 300 },
      }),
      r({
        tokens: { input: 200, output: 100, peak_context: 2500, per_turn: [] },
        timing: { total_ms: 3000, model_thinking_ms: 2000, tool_round_trip_ms: 1000 },
      }),
    ];
    const md = generateMarkdown(records);
    // peak ctx mean = 2000
    expect(md).toMatch(/2000/);
    // mean think = 1350; mean tool = 650
    expect(md).toMatch(/1350/);
    expect(md).toMatch(/650/);
    expect(md).toMatch(/mean think ms/);
    expect(md).toMatch(/mean tool ms/);
    expect(md).toMatch(/mean peak ctx/);
  });

  it('reports TIR / TESR / CER tool-use metrics per cell', () => {
    // Borrowed from FinToolBench:
    //  TIR  = runs_with_tools / total_runs
    //  TESR = successful_tool_calls / total_tool_calls
    //  CER  = runs_with_tools_and_no_errors / runs_with_tools
    const records = [
      r({
        variant_id: 'jintel-mcp',
        tool_calls: [
          { name: 'searchEntities', args: {}, latency_ms: 20 },
          { name: 'entitiesByTickers', args: {}, latency_ms: 30 },
        ],
      }),
      r({
        variant_id: 'jintel-mcp',
        query_id: 'q-002',
        tool_calls: [{ name: 'searchEntities', args: {}, latency_ms: 10, error: 'boom' }],
      }),
      r({
        variant_id: 'jintel-mcp',
        query_id: 'q-003',
        tool_calls: [],
      }),
    ];
    const md = generateMarkdown(records);
    // TIR = 2/3 = 66.7%
    expect(md).toMatch(/66\.7%/);
    expect(md).toMatch(/TIR/);
    expect(md).toMatch(/TESR/);
    expect(md).toMatch(/CER/);
    // CER = 1/2 = 50.0%
    expect(md).toMatch(/50\.0%/);
  });
});
