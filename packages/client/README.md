# @yojinhq/jintel-client

TypeScript client for the [Jintel](https://api.jintel.ai) intelligence API. Typed queries, Zod-validated responses, an optional response cache, and a dynamic query builder that threads per-field filters into the underlying GraphQL.

## Install

```bash
npm install @yojinhq/jintel-client
```

## Quick start

```ts
import { JintelClient } from '@yojinhq/jintel-client';

const jintel = new JintelClient({ apiKey: process.env.JINTEL_API_KEY! });

const quotes = await jintel.quotes(['AAPL', 'MSFT', 'BTC']);
const aapl = await jintel.enrichEntity('AAPL', ['market', 'news', 'analyst']);
```

All public methods return `JintelResult<T>` — a discriminated union `{ success: true, data } | { success: false, error }` — so errors never throw. Use `jintel.request(query, variables)` for arbitrary GraphQL.

## Filtering array sub-graphs

Most array fields accept an optional `filter` argument. The generic `ArrayFilterInput` covers date range + limit + sort; many sub-graphs have domain-specific inputs with extra dimensions.

```ts
// Generic ArrayFilterInput — research, predictions, discussions, social, institutionalHoldings,
// earningsPressReleases, periodicFilings, market.history/keyEvents/shortInterest, economics.
await jintel.enrichEntity('AAPL', ['research', 'market'], {
  filter: { since: '2025-01-01', limit: 10, sort: 'DESC' },
});

// NewsFilterInput — filter by source and sentiment score
await jintel.enrichEntity('AAPL', ['news'], {
  newsFilter: { sources: ['CNBC', 'finnhub'], minSentiment: 0, limit: 10 },
});

// ExecutivesFilterInput — top-paid officers only
await jintel.enrichEntity('AAPL', ['executives'], {
  executivesFilter: { minPay: 1_000_000, sortBy: 'PAY_DESC', limit: 5 },
});

// InsiderTradeFilterInput — directors only, acquisitions >= $100k
await jintel.enrichEntity('AAPL', ['insiderTrades'], {
  insiderTradesFilter: { isDirector: true, acquiredDisposed: 'ACQUIRED', minValue: 100_000 },
});

// EarningsFilterInput — upcoming periods only, or reported beats >= 5%
await jintel.enrichEntity('AAPL', ['earnings'], {
  earningsFilter: { onlyReported: true, minSurprisePercent: 5 },
});

// SegmentRevenueFilterInput — product breakdown >= $1B
await jintel.enrichEntity('AAPL', ['segmentedRevenue'], {
  segmentedRevenueFilter: { dimensions: ['PRODUCT'], minValue: 1_000_000_000 },
});

// TopHoldersFilterInput — paginated top-holder lookup (replaces the old `topHolders` limit/offset)
await jintel.enrichEntity('AAPL', ['topHolders'], {
  topHoldersFilter: { limit: 25, offset: 0, minValue: 50_000 },
});

// FinancialStatementFilterInput — annual only
await jintel.enrichEntity('AAPL', ['financials'], {
  financialStatementsFilter: { periodTypes: ['12M'], limit: 5 },
});

// SanctionsFilterInput + CampaignFinanceFilterInput — on regulatory
await jintel.enrichEntity('Gazprom', ['regulatory'], {
  sanctionsFilter: { minScore: 80, programs: ['SDGT'] },
  campaignFinanceFilter: { cycle: 2024, party: 'DEM' },
});

// FilingsFilterInput — narrow SEC filings by form type
await jintel.enrichEntity('AAPL', ['regulatory'], {
  filingsFilter: { types: ['FILING_10K', 'FILING_10Q'], limit: 5 },
});

// RiskSignalFilterInput — drop low-severity noise
await jintel.enrichEntity('Gazprom', ['risk'], {
  riskSignalFilter: { severities: ['HIGH', 'CRITICAL'] },
});

// OptionsChainFilterInput — options chains can exceed 5 000 rows; filter aggressively
await jintel.enrichEntity('BTC', ['derivatives'], {
  optionsFilter: {
    optionType: 'CALL',
    strikeMin: 60_000,
    strikeMax: 80_000,
    minOpenInterest: 100,
    sort: 'VOLUME_DESC',
    limit: 25,
  },
});

// FuturesCurveFilterInput — defaults to ASC (nearest contract first)
await jintel.enrichEntity('BTC', ['derivatives'], {
  futuresFilter: { limit: 10 },
});
```

Each filter option applies to one sub-graph only, so you can mix them in a single request. The generic `filter` no longer applies to fields that migrated to domain-specific inputs (`news`, `executives`, `insiderTrades`, `earnings`, `segmentedRevenue`, `topHolders`, `financials.*`, `regulatory.sanctions`, `regulatory.campaignFinance`) — use the dedicated option for those.

### Top-level queries

Economics and short-interest queries accept the generic `ArrayFilterInput`. `sanctionsScreen` and `campaignFinance` accept their domain-specific filters:

```ts
await jintel.gdp('USA', 'REAL', { since: '2010-01-01', limit: 20 });
await jintel.inflation('USA', { since: '2020-01-01' });
await jintel.shortInterest('GME', { limit: 5 });

// Root sanctions screen — filter by score, list, or program
await jintel.sanctionsScreen('Gazprom', 'RU', { minScore: 80, listNames: ['SDN'] });

// Root campaign finance — narrow to party / state / cycle
await jintel.campaignFinance('Acme PAC', 2024, { party: 'DEM', state: 'CA', minRaised: 100_000 });

// FRED economic series — observations are filterable (ArrayFilterInput)
await jintel.fred('UNRATE', { since: '2000-01-01', limit: 300 });
await jintel.fredBatch(['GDPC1', 'CPIAUCSL'], { since: '2010-01-01' });
```

### Defaults

| Filter | Default limit | Default sort |
| --- | --- | --- |
| `ArrayFilterInput` | 20 | `DESC` |
| `NewsFilterInput` | 20 | `DESC` (by date) |
| `ExecutivesFilterInput` | 20 | `PAY_DESC` |
| `InsiderTradeFilterInput` | 20 | `DESC` (by transactionDate) |
| `EarningsFilterInput` | 20 | `DESC` (by reportDate) |
| `SegmentRevenueFilterInput` | 20 | `DESC` (by filingDate) |
| `TopHoldersFilterInput` | 20 (offset 0) | `DESC` (by value) |
| `FinancialStatementFilterInput` | 20 | `DESC` (by periodEnding) |
| `SanctionsFilterInput` | 20 | `DESC` (by score) |
| `CampaignFinanceFilterInput` | 20 | `DESC` (by totalRaised) |
| `FilingsFilterInput` | 20 | `DESC` |
| `RiskSignalFilterInput` | 20 | `DESC` |
| `FuturesCurveFilterInput` | 50 | `ASC` |
| `OptionsChainFilterInput` | 100 | `EXPIRATION_ASC` |
| `ClinicalTrialFilterInput` | 20 | `DESC` (by startDate) |
| `FdaEventFilterInput` | 20 | `DESC` (by reportDate) |
| `LitigationFilterInput` | 20 | `DESC` (by dateFiled) |
| `GovernmentContractFilterInput` | 20 | `DESC` (by actionDate) |

Omitting `filter` on a sub-graph returns the full upstream set with that input's defaults applied.

### Breaking changes in 0.21

- `topHolders: { limit, offset }` option **removed**. Use `topHoldersFilter: { limit, offset, minValue, since, until, sort }` instead.
- The generic `filter` option no longer threads into `news`, `insiderTrades`, `earnings`, `segmentedRevenue`, or `financials.*` — use the new domain-specific filter options above.

## Batch enrichment

`batchEnrich` accepts up to 20 tickers and pushes server-side loaders to batch and deduplicate upstream calls:

```ts
const batch = await jintel.batchEnrich(
  ['AAPL', 'MSFT', 'GOOG'],
  ['market', 'news', 'technicals'],
  { filter: { limit: 5 } },
);
```

## Response caching

Pass `cache: true` to enable an in-process TTL cache (30 s for quotes, 5 min for enrich / price history). Eliminates redundant HTTP when the same data is requested in a short window.

```ts
const jintel = new JintelClient({
  apiKey: process.env.JINTEL_API_KEY!,
  cache: { quotesTtlMs: 15_000, enrichTtlMs: 120_000 },
});

jintel.invalidateCache(['AAPL']); // after an external signal event
```

## License

MIT
