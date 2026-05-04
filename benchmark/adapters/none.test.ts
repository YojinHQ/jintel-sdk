import { describe, it, expect } from 'vitest';
import { createNoneAdapter } from './none.js';

describe('none adapter', () => {
  it('exposes the bare variant id', () => {
    const a = createNoneAdapter();
    expect(a.variant).toBe('bare');
  });

  it('returns empty tool list', () => {
    const a = createNoneAdapter();
    expect(a.toolsForAnthropic()).toEqual([]);
  });

  it('invoke throws — bare model has no tools', async () => {
    const a = createNoneAdapter();
    await expect(a.invoke({ name: 'anything', input: {} })).rejects.toThrow(/no tools/i);
  });

  it('system prompt fragment indicates no tools', () => {
    const a = createNoneAdapter();
    expect(a.toolsSystemPromptFragment()).toMatch(/no tools/i);
  });
});
