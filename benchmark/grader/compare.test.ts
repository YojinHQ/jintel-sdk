import { describe, it, expect } from 'vitest';
import { compare } from './compare.js';

describe('compare', () => {
  it('exact_match: passes on string equality', () => {
    expect(compare('foo', { type: 'exact_match', value: 'foo' }).pass).toBe(true);
  });

  it('exact_match: fails when strings differ', () => {
    const result = compare('foo', { type: 'exact_match', value: 'bar' });
    expect(result.pass).toBe(false);
    expect(result.diff).toEqual({ expected: 'bar', actual: 'foo' });
  });

  it('numeric_tolerance: passes within 1% tolerance', () => {
    expect(compare(101, { type: 'numeric_tolerance', value: 100, tolerance_pct: 1 }).pass).toBe(true);
  });

  it('numeric_tolerance: fails outside tolerance', () => {
    expect(compare(110, { type: 'numeric_tolerance', value: 100, tolerance_pct: 1 }).pass).toBe(false);
  });

  it('numeric_tolerance: parses numeric strings like "$8.70"', () => {
    expect(compare('$8.70', { type: 'numeric_tolerance', value: 8.7, tolerance_pct: 1 }).pass).toBe(true);
  });

  it('set_overlap: passes when overlap meets threshold', () => {
    const result = compare(['a', 'b', 'c'], {
      type: 'set_overlap',
      value: ['a', 'b', 'd'],
      threshold: 0.5,
    });
    expect(result.pass).toBe(true);
  });

  it('set_overlap: fails below threshold', () => {
    const result = compare(['a'], { type: 'set_overlap', value: ['x', 'y'], threshold: 0.5 });
    expect(result.pass).toBe(false);
  });

  it('structured_match: applies per-field rules', () => {
    const result = compare(
      { price: 100.5, ticker: 'AAPL' },
      {
        type: 'structured_match',
        value: { price: 100, ticker: 'AAPL' },
        fields: {
          price: { type: 'numeric_tolerance', tolerance_pct: 1 },
          ticker: { type: 'exact_match' },
        },
      },
    );
    expect(result.pass).toBe(true);
  });

  it('structured_match: fails when any field fails', () => {
    const result = compare(
      { price: 110, ticker: 'AAPL' },
      {
        type: 'structured_match',
        value: { price: 100, ticker: 'AAPL' },
        fields: {
          price: { type: 'numeric_tolerance', tolerance_pct: 1 },
          ticker: { type: 'exact_match' },
        },
      },
    );
    expect(result.pass).toBe(false);
  });
});
