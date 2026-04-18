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

Most array fields accept an optional `filter` argument. The generic shape is `ArrayFilterInput` (date range + limit + sort); four fields use domain-specific inputs where extra dimensions matter.

```ts
// Generic ArrayFilterInput — news, research, history, financials.*, economics, etc.
await jintel.enrichEntity('AAPL', ['news', 'market'], {
  filter: { since: '2025-01-01', limit: 10, sort: 'DESC' },
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

Each filter option applies to one sub-graph only, so you can mix them in a single request. The generic `filter` applies to every array sub-graph that takes `ArrayFilterInput` (news, research, history, keyEvents, shortInterest, financials.\*, insiderTrades, earnings, etc.).

### Top-level queries

Economics and short-interest queries accept the same generic filter:

```ts
await jintel.gdp('USA', 'REAL', { since: '2010-01-01', limit: 20 });
await jintel.inflation('USA', { since: '2020-01-01' });
await jintel.shortInterest('GME', { limit: 5 });
```

### Defaults

| Filter | Default limit | Default sort |
| --- | --- | --- |
| `ArrayFilterInput` | 20 | `DESC` |
| `FilingsFilterInput` | 20 | `DESC` |
| `RiskSignalFilterInput` | 20 | `DESC` |
| `FuturesCurveFilterInput` | 50 | `ASC` |
| `OptionsChainFilterInput` | 100 | `EXPIRATION_ASC` |

Omitting `filter` on an `ArrayFilterInput` field returns the full upstream set (back-compat). Domain-specific filter fields always apply their defaults.

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
