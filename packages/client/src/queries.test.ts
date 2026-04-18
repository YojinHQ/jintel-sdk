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

  it('does not add filter var when only non-filterable fields requested', () => {
    // technicals and analyst don't accept any filter input
    const query = buildEnrichQuery(['technicals', 'analyst'], { since: '2024-01-01' });
    expect(query).not.toContain('$filter');
    expect(query).not.toContain('ArrayFilterInput');
  });

  it('threads ArrayFilterInput into market.history/keyEvents/shortInterest when filter is set', () => {
    const query = buildEnrichQuery(['market'], { since: '2024-01-01' });
    expect(query).toContain('$filter: ArrayFilterInput');
    expect(query).toContain('history(filter: $filter)');
    expect(query).toContain('keyEvents(filter: $filter)');
    expect(query).toContain('shortInterest(filter: $filter)');
  });

  it('adds filter var when mixed fields include an array sub-graph', () => {
    const query = buildEnrichQuery(['risk', 'news'], { limit: 5 });
    expect(query).toContain('$filter: ArrayFilterInput');
    expect(query).toContain('news(filter: $filter)');
    // risk (without riskSignalFilter) stays unfiltered
    expect(query).toMatch(/risk\s*\{/);
  });

  it('threads FilingsFilterInput into regulatory.filings when filingsFilter is set', () => {
    const query = buildEnrichQuery(['regulatory'], { filingsFilter: { types: ['FILING_10K'] } });
    expect(query).toContain('$filingsFilter: FilingsFilterInput');
    expect(query).toContain('filings(filter: $filingsFilter)');
  });

  it('threads RiskSignalFilterInput into risk.signals when riskSignalFilter is set', () => {
    const query = buildEnrichQuery(['risk'], { riskSignalFilter: { severities: ['HIGH', 'CRITICAL'] } });
    expect(query).toContain('$riskSignalFilter: RiskSignalFilterInput');
    expect(query).toContain('signals(filter: $riskSignalFilter)');
  });

  it('threads options/futures filters into derivatives sub-graph', () => {
    const query = buildEnrichQuery(['derivatives'], {
      optionsFilter: { optionType: 'CALL', minOpenInterest: 100 },
      futuresFilter: { limit: 10 },
    });
    expect(query).toContain('$optionsFilter: OptionsChainFilterInput');
    expect(query).toContain('$futuresFilter: FuturesCurveFilterInput');
    expect(query).toContain('options(filter: $optionsFilter)');
    expect(query).toContain('futures(filter: $futuresFilter)');
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
