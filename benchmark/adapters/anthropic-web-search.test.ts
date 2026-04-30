import { describe, it, expect } from 'vitest';
import { createAnthropicWebSearchAdapter } from './anthropic-web-search.js';

describe('anthropic-web-search adapter', () => {
  it('declares the correct variant id', () => {
    const adapter = createAnthropicWebSearchAdapter();
    expect(adapter.variant).toBe('anthropic-web-search');
  });

  it('declares the web_search server-side tool for Anthropic', () => {
    const adapter = createAnthropicWebSearchAdapter();
    const tools = adapter.toolsForAnthropic();
    expect(tools).toHaveLength(1);
    const tool = tools[0] as { type?: string; name: string };
    expect(tool.type).toBe('web_search_20250305');
    expect(tool.name).toBe('web_search');
  });

  it('throws when invoke is called (server-side execution)', async () => {
    const adapter = createAnthropicWebSearchAdapter();
    await expect(adapter.invoke({ name: 'web_search', input: { query: 'x' } })).rejects.toThrow(/server-side/);
  });

  it('mentions web search in the system prompt fragment', () => {
    const adapter = createAnthropicWebSearchAdapter();
    expect(adapter.toolsSystemPromptFragment()).toMatch(/web search/i);
  });
});
