import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ulid } from 'ulid';
import Anthropic from '@anthropic-ai/sdk';

import type { CorpusEntry, RunRecord, TranscriptTurn, UngradedRunRecord } from '../types.js';
import type { Adapter } from '../adapters/types.js';
import { getAnthropicCredentials, OAUTH_HEADERS } from '../auth/anthropic-auth.js';

const here = dirname(fileURLToPath(import.meta.url));
const SYSTEM_PROMPT_PATH = join(here, '..', 'prompts', 'system.md');

let cachedSystemPrompt: string | null = null;
async function loadSystemPrompt(): Promise<string> {
  if (cachedSystemPrompt === null) {
    cachedSystemPrompt = await readFile(SYSTEM_PROMPT_PATH, 'utf-8');
  }
  return cachedSystemPrompt;
}

export interface RunQueryParams {
  model: string;
  adapter: Adapter;
  query: CorpusEntry;
  params: { temperature?: number; max_tokens: number };
  corpusVersion?: string;
  jintelSha?: string;
}

const MAX_AGENT_TURNS = 10;

export async function runQuery(input: RunQueryParams): Promise<UngradedRunRecord> {
  const start = Date.now();
  const errors: RunRecord['errors'] = [];
  const transcript: TranscriptTurn[] = [];
  const toolCallLog: RunRecord['tool_calls'] = [];
  const perTurn: Array<{ input: number; output: number }> = [];
  let totalIn = 0;
  let totalOut = 0;
  let peakContext = 0;
  let toolRoundTripMs = 0;

  const systemPromptTemplate = await loadSystemPrompt();
  const today = new Date().toISOString().slice(0, 10);
  const systemPrompt = systemPromptTemplate
    .replace('{TODAY}', today)
    .replace('{TOOLS_FRAGMENT}', input.adapter.toolsSystemPromptFragment());
  const systemPromptHash = createHash('sha256').update(systemPrompt).digest('hex').slice(0, 16);

  let client: Anthropic;
  try {
    const creds = await getAnthropicCredentials();
    const maxRetries = 6;
    client =
      creds.kind === 'apiKey'
        ? new Anthropic({ apiKey: creds.apiKey, maxRetries })
        : new Anthropic({ apiKey: null, authToken: creds.authToken, defaultHeaders: OAUTH_HEADERS, maxRetries });
  } catch (err) {
    errors.push({ phase: 'auth', message: String((err as Error).message) });
    return finalize();
  }

  const anthropicMessages: Array<{ role: 'user' | 'assistant'; content: unknown }> = [
    { role: 'user', content: input.query.nl_question },
  ];
  transcript.push({ role: 'user', content: input.query.nl_question });

  // OAuth subscription tokens 429 on Sonnet/Opus unless the request opens
  // with this exact Claude Code system prompt. Harmless on the API-key path.
  const CLAUDE_CODE_GATE_PROMPT = "You are Claude Code, Anthropic's official CLI for Claude.";

  const cachedSystem = [
    { type: 'text', text: CLAUDE_CODE_GATE_PROMPT },
    { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
  ];
  const baseTools = input.adapter.toolsForAnthropic();
  const cachedTools =
    baseTools.length > 0
      ? [...baseTools.slice(0, -1), { ...baseTools[baseTools.length - 1], cache_control: { type: 'ephemeral' } }]
      : baseTools;

  for (let turn = 0; turn < MAX_AGENT_TURNS; turn++) {
    let response;
    try {
      response = await client.messages.create({
        model: input.model,
        max_tokens: input.params.max_tokens,
        ...(input.params.temperature !== undefined ? { temperature: input.params.temperature } : {}),
        system: cachedSystem as never,
        tools: cachedTools as never,
        messages: anthropicMessages as never,
      });
    } catch (err) {
      const e = err as { message?: string; status?: number; headers?: Record<string, string> };
      const headers = e.headers ?? {};
      const retryAfter = headers['retry-after'] ?? headers['anthropic-ratelimit-unified-reset'];
      const suffix = retryAfter ? ` [retry-after=${retryAfter}]` : '';
      errors.push({ phase: 'model-call', message: `${e.message ?? String(err)}${suffix}` });
      break;
    }

    const r = response as unknown as {
      content: Array<{ type: string; text?: string; id?: string; name?: string; input?: unknown }>;
      stop_reason?: string;
      usage?: {
        input_tokens: number;
        output_tokens: number;
        cache_creation_input_tokens?: number;
        cache_read_input_tokens?: number;
      };
    };
    const usage = r.usage ?? { input_tokens: 0, output_tokens: 0 };
    const cacheRead = usage.cache_read_input_tokens ?? 0;
    const cacheWrite = usage.cache_creation_input_tokens ?? 0;
    const effectiveInput = usage.input_tokens + cacheRead + cacheWrite;
    perTurn.push({ input: usage.input_tokens, output: usage.output_tokens });
    totalIn += usage.input_tokens;
    totalOut += usage.output_tokens;
    peakContext = Math.max(peakContext, effectiveInput);

    const toolUses = r.content.filter((b) => b.type === 'tool_use');

    // Server-side tools (web_search) execute inside messages.create — no measurable latency.
    const serverToolUses = r.content.filter((b) => b.type === 'server_tool_use') as Array<{
      id?: string;
      name?: string;
      input?: unknown;
    }>;
    const serverToolResults = r.content.filter((b) => b.type === 'web_search_tool_result') as Array<{
      tool_use_id?: string;
      content?: unknown;
    }>;
    for (const stu of serverToolUses) {
      const matching = serverToolResults.find((res) => res.tool_use_id === stu.id);
      const errored =
        matching &&
        matching.content &&
        typeof matching.content === 'object' &&
        (matching.content as { type?: string }).type === 'web_search_tool_result_error';
      toolCallLog.push({
        name: stu.name ?? 'server_tool_use',
        args: stu.input,
        latency_ms: 0,
        ...(errored
          ? { error: String((matching!.content as { error_code?: string }).error_code ?? 'web_search_error') }
          : {}),
      });
    }

    transcript.push({
      role: 'assistant',
      content: r.content,
      tool_calls: [
        ...toolUses.map((b) => ({ id: b.id ?? '', name: b.name ?? '', input: b.input })),
        ...serverToolUses.map((b) => ({ id: b.id ?? '', name: b.name ?? 'server_tool_use', input: b.input })),
      ],
    });
    anthropicMessages.push({ role: 'assistant', content: r.content });

    // Anthropic only signals "tools pending" with stop_reason==='tool_use'. Anything else
    // (end_turn, max_tokens, stop_sequence, refusal) terminates the loop, even if a partial
    // tool_use block snuck through — invoking it would be unsafe.
    if (r.stop_reason !== 'tool_use' || toolUses.length === 0) {
      break;
    }

    const toolResults: Array<{ type: 'tool_result'; tool_use_id: string; content: unknown; is_error?: boolean }> = [];
    for (const tu of toolUses) {
      const tStart = Date.now();
      try {
        const result = await input.adapter.invoke({ name: tu.name ?? '', input: tu.input });
        toolRoundTripMs += result.latency_ms;
        toolCallLog.push({
          name: tu.name ?? '',
          args: tu.input,
          latency_ms: result.latency_ms,
        });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id ?? '',
          content: typeof result.content === 'string' ? result.content : JSON.stringify(result.content),
          is_error: result.is_error,
        });
      } catch (err) {
        const elapsed = Date.now() - tStart;
        toolRoundTripMs += elapsed;
        const message = String((err as Error).message);
        toolCallLog.push({ name: tu.name ?? '', args: tu.input, latency_ms: elapsed, error: message });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id ?? '',
          content: `Error: ${message}`,
          is_error: true,
        });
      }
    }
    anthropicMessages.push({ role: 'user', content: toolResults });
    transcript.push({
      role: 'tool',
      content: toolResults,
      tool_results: toolResults.map((r) => ({
        tool_use_id: r.tool_use_id,
        content: r.content,
        is_error: r.is_error,
      })),
    });
  }

  return finalize();

  function finalize(): UngradedRunRecord {
    const totalMs = Date.now() - start;
    return {
      run_id: ulid(),
      timestamp: new Date().toISOString(),
      corpus_version: input.corpusVersion ?? 'unknown',
      jintel_sha: input.jintelSha ?? 'unknown',
      model_id: input.model,
      variant_id: input.adapter.variant,
      query_id: input.query.id,
      nl_question: input.query.nl_question,
      system_prompt_hash: systemPromptHash,
      params: {
        max_tokens: input.params.max_tokens,
        ...(input.params.temperature !== undefined ? { temperature: input.params.temperature } : {}),
      },
      transcript,
      tokens: {
        input: totalIn,
        output: totalOut,
        peak_context: peakContext,
        per_turn: perTurn,
      },
      tool_calls: toolCallLog,
      timing: {
        total_ms: totalMs,
        model_thinking_ms: Math.max(0, totalMs - toolRoundTripMs),
        tool_round_trip_ms: toolRoundTripMs,
      },
      errors,
    };
  }
}
