import { describe, it, expect } from 'vitest';
import { loadCorpus, selectQueries } from './corpus-loader.js';

describe('corpus loader', () => {
  it('loadCorpus reads all YAML files from corpus/', async () => {
    const entries = await loadCorpus();
    expect(entries.length).toBeGreaterThanOrEqual(2);
    const ids = entries.map((e) => e.id);
    expect(ids).toContain('q-001');
    expect(ids).toContain('q-002');
  });

  it('loadCorpus returns entries sorted by id (deterministic order)', async () => {
    const entries = await loadCorpus();
    const ids = entries.map((e) => e.id);
    const sorted = [...ids].sort();
    expect(ids).toEqual(sorted);
  });

  it('loadCorpus validates required fields', async () => {
    const entries = await loadCorpus();
    for (const e of entries) {
      expect(e.id).toBeTruthy();
      expect(e.nl_question).toBeTruthy();
      expect(e.expected).toBeDefined();
      expect(e.expected.value).toBeDefined();
      expect(e.expected.source).toBeTruthy();
      expect(e.comparison.type).toBeTruthy();
    }
  });

  it('auto-detects numeric_tolerance for entries without explicit comparison (q-001)', async () => {
    const all = await loadCorpus();
    const q001 = all.find((e) => e.id === 'q-001');
    expect(q001).toBeDefined();
    expect(q001!.comparison.type).toBe('numeric_tolerance');
    expect((q001!.comparison as { type: 'numeric_tolerance'; tolerance_pct: number }).tolerance_pct).toBe(1.0);
  });

  it('preserves explicit comparison when provided (q-002)', async () => {
    const all = await loadCorpus();
    const q002 = all.find((e) => e.id === 'q-002');
    expect(q002).toBeDefined();
    expect(q002!.comparison.type).toBe('numeric_tolerance');
    expect((q002!.comparison as { type: 'numeric_tolerance'; tolerance_pct: number }).tolerance_pct).toBe(2.0);
  });

  it('selectQueries: "all" returns all entries', async () => {
    const all = await loadCorpus();
    const selected = selectQueries(all, 'all');
    expect(selected).toHaveLength(all.length);
  });

  it('selectQueries: numeric returns first N', async () => {
    const all = await loadCorpus();
    const selected = selectQueries(all, '1');
    expect(selected).toHaveLength(1);
    expect(selected[0].id).toBe(all[0].id);
  });

  it('selectQueries: comma-separated IDs filters to exact matches', async () => {
    const all = await loadCorpus();
    const selected = selectQueries(all, 'q-002');
    expect(selected.map((e) => e.id)).toEqual(['q-002']);
  });

  it('selectQueries: throws on unknown ID', async () => {
    const all = await loadCorpus();
    expect(() => selectQueries(all, 'q-999')).toThrow(/unknown query id/i);
  });
});
