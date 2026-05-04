import type { JintelClient } from '@yojinhq/jintel-client';
import type { ToolDefinition } from './types.js';
import {
  ENRICHMENT_FIELDS_SCHEMA,
  asEnrichmentFields,
  asString,
  asStringArray,
  errorMessage,
  fail,
  runTool,
} from './shared.js';

export function buildEnrichTools(client: JintelClient): ToolDefinition[] {
  return [
    {
      name: 'jintel_enrich',
      bundle: 'enrich' as const,
      description:
        'Fetch the full entity profile for one ticker in a single call — market, news, fundamentals, technicals, regulatory, sentiment, ownership, and more. Use for a deep cross-domain dive. **Specify `fields` to limit the payload** — leaving it empty fetches all 30 sub-graphs and can return very large responses. For a single sub-graph, prefer the dedicated tool (`jintel_news`, `jintel_technicals`, …) which exposes per-domain filters.',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: {
            type: 'string',
            description: 'Ticker symbol (e.g., "AAPL")',
          },
          fields: ENRICHMENT_FIELDS_SCHEMA,
        },
        required: ['ticker'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, 'ticker');
          const fields = asEnrichmentFields(args.fields, 'fields');
          return runTool(() => client.enrichEntity(ticker, fields));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_batch_enrich',
      bundle: 'enrich' as const,
      description:
        'Fetch full entity profiles for up to 20 tickers in one call — preferred over `jintel_enrich` when analyzing multiple assets (server batches and deduplicates upstream calls). **Always specify `fields`** when batching; otherwise the response can exceed 100k tokens. For a single sub-graph across many tickers, the dedicated tool is fine to call per-ticker.',
      inputSchema: {
        type: 'object',
        properties: {
          tickers: {
            type: 'array',
            description: 'Ticker symbols (max 20)',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 20,
          },
          fields: ENRICHMENT_FIELDS_SCHEMA,
        },
        required: ['tickers'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const tickers = asStringArray(args.tickers, 'tickers');
          const fields = asEnrichmentFields(args.fields, 'fields');
          return runTool(() => client.batchEnrich(tickers, fields));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },
  ];
}
