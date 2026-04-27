import { describe, expect, it } from 'vitest';
import { validateFields } from './fields.js';

describe('validateFields', () => {
  const valid = new Set(['revenue', 'netIncome', 'eps']);

  it('returns ok=true and the deduped list when all fields are valid', () => {
    const r = validateFields(['revenue', 'netIncome', 'revenue'], valid);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.fields).toEqual(['revenue', 'netIncome']);
  });

  it('returns ok=false with an error message listing valid fields when an unknown field is present', () => {
    const r = validateFields(['revenue', 'bogus'], valid);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain('unknown field "bogus"');
      expect(r.error).toContain('valid: eps, netIncome, revenue');
    }
  });

  it('returns ok=true with empty fields when input is undefined', () => {
    const r = validateFields(undefined, valid);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.fields).toBeUndefined();
  });

  it('rejects non-string entries', () => {
    const r = validateFields([1 as unknown as string], valid);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('must be a string');
  });

  it('rejects non-array fields', () => {
    const r = validateFields('revenue' as unknown as string[], valid);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('must be an array');
  });
});
