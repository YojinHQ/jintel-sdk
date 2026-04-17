import {
  ALL_ENRICHMENT_FIELDS,
  JintelAuthError,
  JintelClient,
  JintelUnreachableError,
  JintelValidationError,
} from '@yojinhq/jintel-client';
import type {
  EnrichmentField,
  EntityType,
  FamaFrenchSeries,
  JintelResult,
} from '@yojinhq/jintel-client';

export interface ToolContent {
  type: 'text';
  text: string;
}

export interface ToolCallResult {
  content: ToolContent[];
  isError?: boolean;
  [key: string]: unknown;
}

export interface ToolDefinition {
  name: string;
  description: string;
  // JSON Schema object — passed through to the MCP client as-is.
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<ToolCallResult>;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function ok(data: unknown): ToolCallResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

function fail(message: string): ToolCallResult {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

function toResult<T>(result: JintelResult<T>): ToolCallResult {
  if (result.success) return ok(result.data);
  return fail(result.error);
}

function errorMessage(err: unknown): string {
  if (err instanceof JintelAuthError) {
    return `Authentication error: ${err.message}. Check JINTEL_API_KEY.`;
  }
  if (err instanceof JintelUnreachableError) {
    return `Jintel API unreachable: ${err.message}`;
  }
  if (err instanceof JintelValidationError) {
    return `Validation error: ${err.message}`;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

async function runTool<T>(
  invoke: () => Promise<JintelResult<T>>,
): Promise<ToolCallResult> {
  try {
    const result = await invoke();
    return toResult(result);
  } catch (err) {
    return fail(errorMessage(err));
  }
}

// ── Input type guards ──────────────────────────────────────────────────────

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new JintelValidationError(`Argument '${field}' must be a non-empty string`);
  }
  return value;
}

function asOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new JintelValidationError(`Argument '${field}' must be a string`);
  }
  return value;
}

function asOptionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new JintelValidationError(`Argument '${field}' must be a number`);
  }
  return value;
}

function asStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new JintelValidationError(`Argument '${field}' must be a non-empty array of strings`);
  }
  const out: string[] = [];
  for (const [i, item] of value.entries()) {
    if (typeof item !== 'string' || item.trim() === '') {
      throw new JintelValidationError(`Argument '${field}[${i}]' must be a non-empty string`);
    }
    out.push(item);
  }
  return out;
}

const ENTITY_TYPES: EntityType[] = ['COMPANY', 'PERSON', 'CRYPTO', 'COMMODITY', 'INDEX'];
const FAMA_FRENCH_SERIES: FamaFrenchSeries[] = [
  'THREE_FACTOR_DAILY',
  'THREE_FACTOR_MONTHLY',
  'FIVE_FACTOR_DAILY',
  'FIVE_FACTOR_MONTHLY',
];

function asEntityType(value: unknown, field: string): EntityType | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string' || !ENTITY_TYPES.includes(value as EntityType)) {
    throw new JintelValidationError(
      `Argument '${field}' must be one of ${ENTITY_TYPES.join(', ')}`,
    );
  }
  return value as EntityType;
}

function asFamaFrenchSeries(value: unknown, field: string): FamaFrenchSeries {
  if (typeof value !== 'string' || !FAMA_FRENCH_SERIES.includes(value as FamaFrenchSeries)) {
    throw new JintelValidationError(
      `Argument '${field}' must be one of ${FAMA_FRENCH_SERIES.join(', ')}`,
    );
  }
  return value as FamaFrenchSeries;
}

function asEnrichmentFields(value: unknown, field: string): EnrichmentField[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new JintelValidationError(`Argument '${field}' must be an array of strings`);
  }
  const out: EnrichmentField[] = [];
  for (const [i, item] of value.entries()) {
    if (typeof item !== 'string' || !ALL_ENRICHMENT_FIELDS.includes(item as EnrichmentField)) {
      throw new JintelValidationError(
        `Argument '${field}[${i}]' must be one of: ${ALL_ENRICHMENT_FIELDS.join(', ')}`,
      );
    }
    out.push(item as EnrichmentField);
  }
  return out;
}

const ENRICHMENT_FIELDS_SCHEMA = {
  type: 'array',
  description:
    "Optional list of enrichment sub-graphs to fetch. If omitted, all fields are returned.",
  items: {
    type: 'string',
    enum: [...ALL_ENRICHMENT_FIELDS],
  },
} as const;

// ── Tool definitions ───────────────────────────────────────────────────────

export function buildTools(client: JintelClient): ToolDefinition[] {
  return [
    {
      name: 'jintel_quote',
      description:
        'Fetch real-time stock, crypto, and index quotes for one or more tickers. Use for price, change, volume, day range, and market cap. Accepts equity tickers (AAPL, MSFT), crypto (BTC, ETH), and indices (^GSPC). Batch up to many tickers in a single call.',
      inputSchema: {
        type: 'object',
        properties: {
          tickers: {
            type: 'array',
            description: 'Ticker symbols to quote (e.g., ["AAPL", "MSFT", "BTC"])',
            items: { type: 'string' },
            minItems: 1,
          },
        },
        required: ['tickers'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const tickers = asStringArray(args.tickers, 'tickers');
          return runTool(() => client.quotes(tickers));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_search',
      description:
        'Search for entities (companies, people, crypto, commodities, indices) by name, ticker, or keyword. Returns matches with canonical IDs, display names, tickers, and confidence scores. Use before enrich when you only have a company name.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Free-text query (company name, ticker, keyword)',
          },
          type: {
            type: 'string',
            description: 'Optional entity type filter',
            enum: ENTITY_TYPES,
          },
          limit: {
            type: 'number',
            description: 'Max results to return',
            minimum: 1,
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const query = asString(args.query, 'query');
          const type = asEntityType(args.type, 'type');
          const limit = asOptionalNumber(args.limit, 'limit');
          return runTool(() => client.searchEntities(query, { type, limit }));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_enrich',
      description:
        'Fetch a full entity profile for a single ticker — market data, fundamentals, news, technicals, regulatory filings, sentiment, ownership, analyst estimates, and more. Use when you want a deep dive on one company or asset. Specify `fields` to reduce payload size.',
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
      description:
        'Fetch full entity profiles for up to 20 tickers in one call. Preferred over jintel_enrich when analyzing multiple assets — upstream API calls are batched and deduplicated server-side. Specify `fields` to reduce payload size.',
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

    {
      name: 'jintel_sanctions_screen',
      description:
        'Screen a person or organization name against sanctions lists. Returns matches with severity, match type, and justification. Use for KYC, counterparty checks, or regulatory risk assessment.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Full legal name of person or entity' },
          country: {
            type: 'string',
            description: 'Optional ISO country code or name to refine match',
          },
        },
        required: ['name'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const name = asString(args.name, 'name');
          const country = asOptionalString(args.country, 'country');
          return runTool(() => client.sanctionsScreen(name, country));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_price_history',
      description:
        'Fetch OHLCV candle history for up to 20 tickers. Use for backtesting, technical analysis, charting, or volatility studies. Default range is 1y with 1d candles.',
      inputSchema: {
        type: 'object',
        properties: {
          tickers: {
            type: 'array',
            items: { type: 'string' },
            description: 'Ticker symbols (max 20)',
            minItems: 1,
            maxItems: 20,
          },
          range: {
            type: 'string',
            description:
              'Lookback range: "1d", "5d", "1m", "3m", "6m", "1y", "2y", "5y", "10y", "ytd", "max". Default "1y".',
          },
          interval: {
            type: 'string',
            description:
              'Candle interval: "1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1W", "1M", "1Q". Default "1d".',
          },
        },
        required: ['tickers'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const tickers = asStringArray(args.tickers, 'tickers');
          const range = asOptionalString(args.range, 'range');
          const interval = asOptionalString(args.interval, 'interval');
          return runTool(() => client.priceHistory(tickers, range, interval));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_short_interest',
      description:
        'Fetch short interest reports for a US equity ticker. Returns bi-monthly short interest share counts, days-to-cover, and revision history. Use for crowdedness / squeeze analysis.',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: { type: 'string', description: 'US equity ticker (e.g., "GME")' },
        },
        required: ['ticker'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, 'ticker');
          return runTool(() => client.shortInterest(ticker));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_campaign_finance',
      description:
        'Fetch US campaign finance data (PACs, candidate committees) matching a name. Use for political-exposure checks, donor research, or ESG-adjacent due diligence.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Committee / candidate / organization name' },
          cycle: {
            type: 'number',
            description: 'Election cycle year (e.g., 2024). Optional.',
          },
        },
        required: ['name'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const name = asString(args.name, 'name');
          const cycle = asOptionalNumber(args.cycle, 'cycle');
          return runTool(() => client.campaignFinance(name, cycle));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_institutional_holdings',
      description:
        'Fetch institutional 13F holdings for a filer by CIK. Returns positions from the latest 13F-HR filing. Use for tracking what funds own, position sizing, and whale-watching.',
      inputSchema: {
        type: 'object',
        properties: {
          cik: {
            type: 'string',
            description: 'Central Index Key of the 13F filer (e.g., "0001067983" for Berkshire)',
          },
          since: {
            type: 'string',
            description: 'ISO 8601 date — only return filings on or after this date',
          },
          until: {
            type: 'string',
            description: 'ISO 8601 date — only return filings on or before this date',
          },
          limit: { type: 'number', description: 'Cap holdings returned' },
          sort: {
            type: 'string',
            enum: ['ASC', 'DESC'],
            description: 'Sort direction by filing date (default DESC)',
          },
        },
        required: ['cik'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const cik = asString(args.cik, 'cik');
          const since = asOptionalString(args.since, 'since');
          const until = asOptionalString(args.until, 'until');
          const limit = asOptionalNumber(args.limit, 'limit');
          const sortRaw = asOptionalString(args.sort, 'sort');
          const sort: 'ASC' | 'DESC' | undefined =
            sortRaw === 'ASC' || sortRaw === 'DESC' ? sortRaw : undefined;
          const hasFilter = since != null || until != null || limit != null || sort != null;
          const filter: { since?: string; until?: string; limit?: number; sort?: 'ASC' | 'DESC' } | undefined =
            hasFilter ? { since, until, limit, sort } : undefined;
          return runTool(() => client.institutionalHoldings(cik, filter));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_fama_french',
      description:
        'Fetch Fama-French factor returns (market-minus-risk-free, SMB, HML, RMW, CMA, momentum). Use for factor-based risk attribution, academic finance research, or portfolio analysis.',
      inputSchema: {
        type: 'object',
        properties: {
          series: {
            type: 'string',
            enum: FAMA_FRENCH_SERIES,
            description:
              'Factor series: THREE_FACTOR_DAILY/MONTHLY (Mkt-RF, SMB, HML) or FIVE_FACTOR_DAILY/MONTHLY (adds RMW, CMA)',
          },
          range: {
            type: 'string',
            description: 'Lookback range (e.g., "1y", "5y", "max"). Optional.',
          },
        },
        required: ['series'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const series = asFamaFrenchSeries(args.series, 'series');
          const range = asOptionalString(args.range, 'range');
          return runTool(() => client.famaFrenchFactors(series, range));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_market_status',
      description:
        'Check whether US equity markets are currently open, and get the next open/close times. Use to decide whether to trust intraday prices or to schedule queries.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      handler: async () => {
        return runTool(() => client.marketStatus());
      },
    },
  ];
}
