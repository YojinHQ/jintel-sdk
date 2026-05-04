import { describe, it, expect } from 'vitest';
import { buildEnrichQuery, buildBatchEnrichQuery } from './queries.js';

describe('buildEnrichQuery', () => {
  it('generates query without filter args when no options provided', () => {
    const query = buildEnrichQuery(['research', 'news']);
    expect(query).toContain('research {');
    expect(query).toContain('news {');
    expect(query).not.toContain('$filter');
    expect(query).not.toContain('ArrayFilterInput');
  });

  it('threads ArrayFilterInput into research when generic filter is set', () => {
    const query = buildEnrichQuery(['research'], { since: '2024-01-01' });
    expect(query).toContain('$filter: ArrayFilterInput');
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

  it('news uses NewsFilterInput (not the generic ArrayFilterInput)', () => {
    const query = buildEnrichQuery(['news'], { newsFilter: { sources: ['example'], minSentiment: 0 } });
    expect(query).toContain('$newsFilter: NewsFilterInput');
    expect(query).toContain('news(filter: $newsFilter)');
  });

  it('social.twitter uses TwitterFilterInput when twitterFilter is set', () => {
    const query = buildEnrichQuery(['social'], { twitterFilter: { cashtags: ['AAPL'], minLikes: 10 } });
    expect(query).toContain('$twitterFilter: TwitterFilterInput');
    expect(query).toContain('twitter(filter: $twitterFilter)');
  });

  it('social fields without twitterFilter omit the twitter filter arg', () => {
    const query = buildEnrichQuery(['social']);
    expect(query).not.toContain('$twitterFilter');
    expect(query).toMatch(/twitter\s*\{/);
  });

  it('social can carry both ArrayFilterInput (reddit) and TwitterFilterInput (twitter) at once', () => {
    const query = buildEnrichQuery(['social'], {
      filter: { since: '2025-01-01', limit: 5 },
      twitterFilter: { cashtags: ['AAPL'], excludeRetweets: true },
    });
    expect(query).toContain('$filter: ArrayFilterInput');
    expect(query).toContain('$twitterFilter: TwitterFilterInput');
    expect(query).toContain('reddit(filter: $filter)');
    expect(query).toContain('redditComments(filter: $filter)');
    expect(query).toContain('twitter(filter: $twitterFilter)');
  });

  it('TwitterFilterInput var is omitted when social is not in the selection', () => {
    const query = buildEnrichQuery(['news'], { twitterFilter: { cashtags: ['AAPL'] } });
    expect(query).not.toContain('$twitterFilter');
  });

  it('all TwitterFilterOptions fields trigger the filter flag', () => {
    const fields = [
      { words: ['x'] },
      { phrase: 'p' },
      { anyWords: ['x'] },
      { noneWords: ['x'] },
      { hashtags: ['x'] },
      { cashtags: ['x'] },
      { fromUser: 'x' },
      { toUser: 'x' },
      { mentioning: 'x' },
      { minLikes: 1 },
      { minReposts: 1 },
      { minReplies: 1 },
      { since: '2025-01-01' },
      { until: '2025-01-02' },
      { excludeRetweets: true },
      { excludeReplies: true },
      { limit: 5 },
    ];
    for (const twitterFilter of fields) {
      const query = buildEnrichQuery(['social'], { twitterFilter });
      expect(query, `field ${JSON.stringify(twitterFilter)}`).toContain('$twitterFilter: TwitterFilterInput');
    }
  });

  it('generic filter alone does not thread into news/insiderTrades/earnings/segmentedRevenue (those take domain inputs)', () => {
    const query = buildEnrichQuery(['news', 'insiderTrades', 'earnings', 'segmentedRevenue'], {
      since: '2024-01-01',
    });
    // Generic filter var should not be declared when none of its target fields are in the selection.
    expect(query).not.toContain('$filter: ArrayFilterInput');
    expect(query).toMatch(/news\s*\{/);
    expect(query).toMatch(/insiderTrades\s*\{/);
    expect(query).toMatch(/earnings\s*\{/);
    expect(query).toMatch(/segmentedRevenue\s*\{/);
  });

  it('threads FilingsFilterInput into regulatory.filings when filingsFilter is set', () => {
    const query = buildEnrichQuery(['regulatory'], { filingsFilter: { types: ['FILING_10K'] } });
    expect(query).toContain('$filingsFilter: FilingsFilterInput');
    expect(query).toContain('filings(filter: $filingsFilter)');
  });

  it('threads SanctionsFilterInput into regulatory.sanctions', () => {
    const query = buildEnrichQuery(['regulatory'], { sanctionsFilter: { minScore: 80 } });
    expect(query).toContain('$sanctionsFilter: SanctionsFilterInput');
    expect(query).toContain('sanctions(filter: $sanctionsFilter)');
  });

  it('threads CampaignFinanceFilterInput into regulatory.campaignFinance', () => {
    const query = buildEnrichQuery(['regulatory'], { campaignFinanceFilter: { party: 'DEM' } });
    expect(query).toContain('$campaignFinanceFilter: CampaignFinanceFilterInput');
    expect(query).toContain('campaignFinance(filter: $campaignFinanceFilter)');
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

  it('threads ExecutivesFilterInput into executives', () => {
    const query = buildEnrichQuery(['executives'], { executivesFilter: { minPay: 1_000_000, sortBy: 'PAY_DESC' } });
    expect(query).toContain('$executivesFilter: ExecutivesFilterInput');
    expect(query).toContain('executives(filter: $executivesFilter)');
  });

  it('threads InsiderTradeFilterInput into insiderTrades', () => {
    const query = buildEnrichQuery(['insiderTrades'], {
      insiderTradesFilter: { acquiredDisposed: 'ACQUIRED', minValue: 100_000 },
    });
    expect(query).toContain('$insiderTradesFilter: InsiderTradeFilterInput');
    expect(query).toContain('insiderTrades(filter: $insiderTradesFilter)');
  });

  it('threads EarningsFilterInput into earnings', () => {
    const query = buildEnrichQuery(['earnings'], { earningsFilter: { onlyReported: true, year: 2024 } });
    expect(query).toContain('$earningsFilter: EarningsFilterInput');
    expect(query).toContain('earnings(filter: $earningsFilter)');
  });

  it('threads SegmentRevenueFilterInput into segmentedRevenue', () => {
    const query = buildEnrichQuery(['segmentedRevenue'], {
      segmentedRevenueFilter: { dimensions: ['PRODUCT'], minValue: 1_000_000 },
    });
    expect(query).toContain('$segmentedRevenueFilter: SegmentRevenueFilterInput');
    expect(query).toContain('segmentedRevenue(filter: $segmentedRevenueFilter)');
  });

  it('threads TopHoldersFilterInput into topHolders', () => {
    const query = buildEnrichQuery(['topHolders'], { topHoldersFilter: { limit: 10, offset: 20 } });
    expect(query).toContain('$topHoldersFilter: TopHoldersFilterInput');
    expect(query).toContain('topHolders(filter: $topHoldersFilter)');
  });

  it('threads FinancialStatementFilterInput into financials.income/balanceSheet/cashFlow', () => {
    const query = buildEnrichQuery(['financials'], {
      financialStatementsFilter: { periodTypes: ['12M'], limit: 5 },
    });
    expect(query).toContain('$financialStatementsFilter: FinancialStatementFilterInput');
    expect(query).toContain('income(filter: $financialStatementsFilter)');
    expect(query).toContain('balanceSheet(filter: $financialStatementsFilter)');
    expect(query).toContain('cashFlow(filter: $financialStatementsFilter)');
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
    // entitiesByTickers always carries the optional `asOf` arg, but no filter vars.
    expect(query).toContain('entitiesByTickers(tickers: $tickers, asOf: $asOf)');
    expect(query).toContain('news {');
    expect(query).not.toContain('$filter:');
  });

  it('threads a news-specific filter through a batch query', () => {
    const query = buildBatchEnrichQuery(['news', 'research'], {
      newsFilter: { sources: ['example'], limit: 10 },
      filter: { since: '2024-01-01' },
    });
    expect(query).toContain('$newsFilter: NewsFilterInput');
    expect(query).toContain('news(filter: $newsFilter)');
    expect(query).toContain('$filter: ArrayFilterInput');
    expect(query).toContain('research(filter: $filter)');
  });

  it('emits subsidiaries, concentration, and relationships blocks without filter args by default', () => {
    const query = buildBatchEnrichQuery(['subsidiaries', 'concentration', 'relationships']);
    expect(query).toMatch(/subsidiaries\s*\{/);
    expect(query).toContain('exhibitUrl');
    expect(query).toContain('jurisdiction');
    expect(query).toMatch(/concentration\s*\{/);
    expect(query).toContain('hhi');
    expect(query).toContain('components { label member value share }');
    expect(query).toMatch(/relationships\s*\{/);
    expect(query).toContain('counterpartyCik');
    expect(query).toContain('source {');
    expect(query).not.toContain('$relationshipsFilter');
  });

  it('threads RelationshipFilterInput when relationshipsFilter is set', () => {
    const query = buildBatchEnrichQuery(['relationships'], {
      relationshipsFilter: {
        types: ['SUBSIDIARY', 'CUSTOMER'],
        minConfidence: 0.5,
        limit: 20,
        sort: 'DESC',
      },
    });
    expect(query).toContain('$relationshipsFilter: RelationshipFilterInput');
    expect(query).toContain('relationships(filter: $relationshipsFilter)');
  });

  it('relationships block requests firstSeenAt / lastConfirmedAt (P1.b)', () => {
    const query = buildBatchEnrichQuery(['relationships']);
    expect(query).toContain('firstSeenAt');
    expect(query).toContain('lastConfirmedAt');
  });

  it('emits a parent block without filter args', () => {
    const query = buildBatchEnrichQuery(['parent']);
    expect(query).toMatch(/parent\s*\{/);
    expect(query).toContain('name');
    expect(query).toContain('cik');
    expect(query).toContain('percentOwned');
    expect(query).toContain('source {');
    expect(query).toContain('connector');
    expect(query).toContain('asOf');
    expect(query).toContain('ref');
    expect(query).not.toContain('parent(');
  });
});

describe('asOf is plumbed into entity / batch queries', () => {
  it('buildEnrichQuery declares $asOf and forwards it on entity()', () => {
    const query = buildEnrichQuery(['news']);
    expect(query).toContain('$asOf: String');
    expect(query).toMatch(/entity\(id: \$id, asOf: \$asOf\)/);
  });

  it('buildBatchEnrichQuery declares $asOf and forwards it on entitiesByTickers()', () => {
    const query = buildBatchEnrichQuery(['news']);
    expect(query).toContain('$asOf: String');
    expect(query).toMatch(/entitiesByTickers\(tickers: \$tickers, asOf: \$asOf\)/);
  });
});
