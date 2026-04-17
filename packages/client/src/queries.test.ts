import { describe, it, expect } from 'vitest';
import { buildEnrichQuery, buildBatchEnrichQuery } from './queries.js';

describe('buildEnrichQuery', () => {
  it('generates query without filter args when no options provided', () => {
    const query = buildEnrichQuery(['news', 'research']);
    expect(query).toContain('news {');
    expect(query).toContain('research {');
    expect(query).not.toContain('$filter');
    expect(query).not.toContain('ArrayFilterInput');
  });

  it('includes $filter variable and args when options are provided', () => {
    const query = buildEnrichQuery(['news', 'research'], { since: '2024-01-01' });
    expect(query).toContain('$filter: ArrayFilterInput');
    expect(query).toContain('news(filter: $filter)');
    expect(query).toContain('research(filter: $filter)');
  });

  it('does not add filter var when only non-array fields requested', () => {
    const query = buildEnrichQuery(['market', 'risk'], { since: '2024-01-01' });
    expect(query).not.toContain('$filter');
    expect(query).not.toContain('ArrayFilterInput');
  });

  it('adds filter var when mixed fields include an array sub-graph', () => {
    const query = buildEnrichQuery(['market', 'news'], { limit: 5 });
    expect(query).toContain('$filter: ArrayFilterInput');
    expect(query).toContain('news(filter: $filter)');
    // market should NOT get filter args
    expect(query).toMatch(/market\s*\{/);
  });

  it('includes filter var when only sort is provided', () => {
    const query = buildEnrichQuery(['news'], { sort: 'ASC' });
    expect(query).toContain('$filter: ArrayFilterInput');
    expect(query).toContain('news(filter: $filter)');
  });

  it('is backwards compatible — no options means no filter args', () => {
    const query = buildEnrichQuery(['news']);
    expect(query).toMatch(/news\s*\{/);
    expect(query).not.toContain('news(');
  });
});

describe('buildBatchEnrichQuery', () => {
  it('generates batch query without filter args when no options', () => {
    const query = buildBatchEnrichQuery(['news']);
    expect(query).toContain('entitiesByTickers(tickers: $tickers)');
    expect(query).toContain('news {');
    expect(query).not.toContain('$filter');
  });

  it('includes filter variable when options are provided', () => {
    const query = buildBatchEnrichQuery(['news', 'research'], { since: '2024-01-01', limit: 10 });
    expect(query).toContain('$filter: ArrayFilterInput');
    expect(query).toContain('news(filter: $filter)');
    expect(query).toContain('research(filter: $filter)');
  });
});
