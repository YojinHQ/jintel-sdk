import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNoneAdapter } from '../adapters/none.js';
import type { CorpusEntry } from '../types.js';

const createMock = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class Anthropic {
      messages = { create: createMock };
      constructor(_: unknown) {}
    },
  };
});

vi.mock('../auth/anthropic-auth.js', () => ({
  getAnthropicCredentials: async () => ({ kind: 'apiKey', apiKey: 'test-key' }),
  OAUTH_HEADERS: {},
}));

beforeEach(() => {
  createMock.mockReset();
});

const sampleQuery: CorpusEntry = {
  id: 'q-001',
  nl_question: 'What is 2+2?',
  tags: [],
  expected: { value: 4, source: 'arithmetic' },
  comparison: { type: 'numeric_tolerance', tolerance_pct: 0 },
};

describe('anthropic runner', () => {
  it('runs a single-turn query with no tools and produces a RunRecord', async () => {
    createMock.mockResolvedValueOnce({
      id: 'msg_1',
      role: 'assistant',
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: 'The answer is <answer>4</answer>.' }],
      usage: { input_tokens: 10, output_tokens: 5 },
    });

    const { runQuery } = await import('./anthropic.js');
    const record = await runQuery({
      model: 'claude-haiku-4-5',
      adapter: createNoneAdapter(),
      query: sampleQuery,
      params: { temperature: 0, max_tokens: 1024 },
    });

    expect(record.query_id).toBe('q-001');
    expect(record.variant_id).toBe('bare');
    expect(record.transcript.length).toBeGreaterThan(0);
    expect(record.tokens.input).toBe(10);
    expect(record.tokens.output).toBe(5);
    expect(record.timing.total_ms).toBeGreaterThanOrEqual(0);
    expect(record.errors).toEqual([]);
  });

  it('counts server-side web_search calls (server_tool_use blocks) into tool_calls with latency_ms 0', async () => {
    createMock.mockResolvedValueOnce({
      id: 'msg_ws',
      role: 'assistant',
      stop_reason: 'end_turn',
      content: [
        { type: 'server_tool_use', id: 'srv_1', name: 'web_search', input: { query: 'AAPL eps' } },
        {
          type: 'web_search_tool_result',
          tool_use_id: 'srv_1',
          content: [{ type: 'web_search_result', url: 'https://example.com', title: 't' }],
        },
        { type: 'text', text: 'The answer is <answer>123</answer>.' },
      ],
      usage: { input_tokens: 10, output_tokens: 5 },
    });

    const { runQuery } = await import('./anthropic.js');
    const record = await runQuery({
      model: 'claude-haiku-4-5',
      adapter: createNoneAdapter(),
      query: sampleQuery,
      params: { temperature: 0, max_tokens: 1024 },
    });
    expect(record.tool_calls).toHaveLength(1);
    expect(record.tool_calls[0].name).toBe('web_search');
    expect(record.tool_calls[0].latency_ms).toBe(0);
    expect(record.tool_calls[0].error).toBeUndefined();
  });

  it('marks server_tool_use as errored when matching web_search_tool_result is an error payload', async () => {
    createMock.mockResolvedValueOnce({
      id: 'msg_ws_err',
      role: 'assistant',
      stop_reason: 'end_turn',
      content: [
        { type: 'server_tool_use', id: 'srv_2', name: 'web_search', input: { query: 'x' } },
        {
          type: 'web_search_tool_result',
          tool_use_id: 'srv_2',
          content: { type: 'web_search_tool_result_error', error_code: 'max_uses_exceeded' },
        },
        { type: 'text', text: '<answer>n/a</answer>' },
      ],
      usage: { input_tokens: 1, output_tokens: 1 },
    });

    const { runQuery } = await import('./anthropic.js');
    const record = await runQuery({
      model: 'claude-haiku-4-5',
      adapter: createNoneAdapter(),
      query: sampleQuery,
      params: { temperature: 0, max_tokens: 1024 },
    });
    expect(record.tool_calls).toHaveLength(1);
    expect(record.tool_calls[0].error).toBe('max_uses_exceeded');
  });

  it('captures errors in the errors array on SDK failure', async () => {
    createMock.mockRejectedValueOnce(new Error('rate limit'));
    const { runQuery } = await import('./anthropic.js');
    const record = await runQuery({
      model: 'claude-haiku-4-5',
      adapter: createNoneAdapter(),
      query: sampleQuery,
      params: { temperature: 0, max_tokens: 1024 },
    });
    expect(record.errors.length).toBeGreaterThan(0);
    expect(record.errors[0].message).toMatch(/rate limit/);
  });
});
