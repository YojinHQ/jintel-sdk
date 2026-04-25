import {
  ALL_ENRICHMENT_FIELDS,
  JintelAuthError,
  JintelClient,
  JintelUnreachableError,
  JintelValidationError,
} from "@yojinhq/jintel-client";
import type {
  AcquisitionDirection,
  ArraySubGraphOptions,
  CampaignFinanceFilterOptions,
  ClinicalTrialFilterOptions,
  DiscussionsFilterOptions,
  EarningsFilterOptions,
  Entity,
  EnrichOptions,
  EnrichmentField,
  EntityType,
  ExecutiveSort,
  ExecutivesFilterOptions,
  FamaFrenchSeries,
  FdaEventFilterOptions,
  FdaEventType,
  FilingType,
  FilingsFilterOptions,
  FinancialStatementFilterOptions,
  FuturesCurveFilterOptions,
  GdpType,
  GovernmentContractFilterOptions,
  InsiderTradeFilterOptions,
  InstitutionalHoldingsFilterOptions,
  JintelResult,
  LitigationFilterOptions,
  NewsFilterOptions,
  OptionType,
  OptionsChainFilterOptions,
  OptionsChainSort,
  PredictionMarketFilterOptions,
  RiskSignalFilterOptions,
  RiskSignalType,
  SP500Series,
  SanctionsFilterOptions,
  SegmentDimension,
  SegmentRevenueFilterOptions,
  Severity,
  TopHoldersFilterOptions,
} from "@yojinhq/jintel-client";

export interface ToolContent {
  type: "text";
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
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

function fail(message: string): ToolCallResult {
  return {
    content: [{ type: "text", text: message }],
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
  if (typeof value !== "string" || value.trim() === "") {
    throw new JintelValidationError(
      `Argument '${field}' must be a non-empty string`,
    );
  }
  return value;
}

function asOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new JintelValidationError(`Argument '${field}' must be a string`);
  }
  return value;
}

function asOptionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new JintelValidationError(`Argument '${field}' must be a number`);
  }
  return value;
}

function asStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new JintelValidationError(
      `Argument '${field}' must be a non-empty array of strings`,
    );
  }
  const out: string[] = [];
  for (const [i, item] of value.entries()) {
    if (typeof item !== "string" || item.trim() === "") {
      throw new JintelValidationError(
        `Argument '${field}[${i}]' must be a non-empty string`,
      );
    }
    out.push(item);
  }
  return out;
}

const ENTITY_TYPES: EntityType[] = [
  "COMPANY",
  "PERSON",
  "CRYPTO",
  "COMMODITY",
  "INDEX",
];
const FAMA_FRENCH_SERIES: FamaFrenchSeries[] = [
  "THREE_FACTOR_DAILY",
  "THREE_FACTOR_MONTHLY",
  "FIVE_FACTOR_DAILY",
  "FIVE_FACTOR_MONTHLY",
];

function asEntityType(value: unknown, field: string): EntityType | undefined {
  if (value === undefined || value === null) return undefined;
  if (
    typeof value !== "string" ||
    !ENTITY_TYPES.includes(value as EntityType)
  ) {
    throw new JintelValidationError(
      `Argument '${field}' must be one of ${ENTITY_TYPES.join(", ")}`,
    );
  }
  return value as EntityType;
}

function asFamaFrenchSeries(value: unknown, field: string): FamaFrenchSeries {
  if (
    typeof value !== "string" ||
    !FAMA_FRENCH_SERIES.includes(value as FamaFrenchSeries)
  ) {
    throw new JintelValidationError(
      `Argument '${field}' must be one of ${FAMA_FRENCH_SERIES.join(", ")}`,
    );
  }
  return value as FamaFrenchSeries;
}

function asEnrichmentFields(
  value: unknown,
  field: string,
): EnrichmentField[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new JintelValidationError(
      `Argument '${field}' must be an array of strings`,
    );
  }
  const out: EnrichmentField[] = [];
  for (const [i, item] of value.entries()) {
    if (
      typeof item !== "string" ||
      !ALL_ENRICHMENT_FIELDS.includes(item as EnrichmentField)
    ) {
      throw new JintelValidationError(
        `Argument '${field}[${i}]' must be one of: ${ALL_ENRICHMENT_FIELDS.join(", ")}`,
      );
    }
    out.push(item as EnrichmentField);
  }
  return out;
}

const ENRICHMENT_FIELDS_SCHEMA = {
  type: "array",
  description:
    "Optional list of enrichment sub-graphs to fetch. If omitted, all fields are returned.",
  items: {
    type: "string",
    enum: [...ALL_ENRICHMENT_FIELDS],
  },
} as const;

// ── Additional input guards ────────────────────────────────────────────────

function asOptionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") {
    throw new JintelValidationError(`Argument '${field}' must be a boolean`);
  }
  return value;
}

function asOptionalStringArray(
  value: unknown,
  field: string,
): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new JintelValidationError(
      `Argument '${field}' must be an array of strings`,
    );
  }
  const out: string[] = [];
  for (const [i, item] of value.entries()) {
    if (typeof item !== "string" || item.trim() === "") {
      throw new JintelValidationError(
        `Argument '${field}[${i}]' must be a non-empty string`,
      );
    }
    out.push(item);
  }
  return out;
}

function asOptionalEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new JintelValidationError(
      `Argument '${field}' must be one of ${allowed.join(", ")}`,
    );
  }
  return value as T;
}

function asEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new JintelValidationError(
      `Argument '${field}' must be one of ${allowed.join(", ")}`,
    );
  }
  return value as T;
}

function asOptionalEnumArray<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new JintelValidationError(`Argument '${field}' must be an array`);
  }
  const out: T[] = [];
  for (const [i, item] of value.entries()) {
    if (typeof item !== "string" || !allowed.includes(item as T)) {
      throw new JintelValidationError(
        `Argument '${field}[${i}]' must be one of ${allowed.join(", ")}`,
      );
    }
    out.push(item as T);
  }
  return out;
}

// ── Enum value lists (for runtime validation + JSON Schema enums) ──────────

const ASC_DESC = ["ASC", "DESC"] as const;
const RISK_SIGNAL_TYPES: readonly RiskSignalType[] = [
  "SANCTIONS",
  "LITIGATION",
  "REGULATORY_ACTION",
  "ADVERSE_MEDIA",
  "PEP",
];
const SEVERITIES: readonly Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const FILING_TYPES: readonly FilingType[] = [
  "FILING_10K",
  "FILING_10Q",
  "FILING_8K",
  "ANNUAL_REPORT",
  "OTHER",
];
const OPTION_TYPES: readonly OptionType[] = ["CALL", "PUT"];
const OPTIONS_CHAIN_SORTS: readonly OptionsChainSort[] = [
  "EXPIRATION_ASC",
  "EXPIRATION_DESC",
  "STRIKE_ASC",
  "STRIKE_DESC",
  "VOLUME_DESC",
  "OPEN_INTEREST_DESC",
];
const EXECUTIVE_SORTS: readonly ExecutiveSort[] = [
  "PAY_DESC",
  "PAY_ASC",
  "NAME_ASC",
  "NAME_DESC",
];
const ACQUISITION_DIRECTIONS: readonly AcquisitionDirection[] = [
  "ACQUIRED",
  "DISPOSED",
];
const SEGMENT_DIMENSIONS: readonly SegmentDimension[] = [
  "PRODUCT",
  "SEGMENT",
  "GEOGRAPHY",
  "CUSTOMER",
];
const FDA_EVENT_TYPES: readonly FdaEventType[] = [
  "DRUG_ADVERSE",
  "DEVICE_ADVERSE",
  "DRUG_RECALL",
];
const GDP_TYPES: readonly GdpType[] = ["REAL", "NOMINAL", "FORECAST"];
const SP500_SERIES: readonly SP500Series[] = [
  "PE_MONTH",
  "SHILLER_PE_MONTH",
  "DIVIDEND_YIELD_MONTH",
  "EARNINGS_YIELD_MONTH",
];

// ── Sub-graph helper ───────────────────────────────────────────────────────

/**
 * Fetch a single enrichment sub-graph for a ticker and return the relevant slice.
 * Used by all the per-domain tools (jintel_news, jintel_executives, etc) that wrap
 * `client.enrichEntity(ticker, [field], options)` and expose the field directly.
 *
 * Returns the entity ID + tickers + the requested slice, so the agent has just enough
 * context to know which entity it's looking at without re-fetching the full profile.
 */
async function fetchSubGraph<K extends EnrichmentField>(
  client: JintelClient,
  ticker: string,
  field: K,
  options: EnrichOptions | undefined,
): Promise<
  JintelResult<{ id: string; tickers: string[] | null; data: Entity[K] }>
> {
  const result = await client.enrichEntity(ticker, [field], options);
  if (!result.success) return result;
  const entity = result.data;
  return {
    success: true,
    data: {
      id: entity.id,
      tickers: entity.tickers ?? null,
      data: entity[field],
    },
  };
}

/**
 * Build a generic ArraySubGraphOptions filter from raw args. Returns undefined if no
 * filter fields are present, so we don't waste a `filter` variable on noise.
 */
function buildArrayFilter(
  args: Record<string, unknown>,
): ArraySubGraphOptions | undefined {
  const since = asOptionalString(args.since, "since");
  const until = asOptionalString(args.until, "until");
  const limit = asOptionalNumber(args.limit, "limit");
  const sort = asOptionalEnum(args.sort, "sort", ASC_DESC);
  if (since == null && until == null && limit == null && sort == null) {
    return undefined;
  }
  return { since, until, limit, sort };
}

// ── Reusable JSON Schema fragments ─────────────────────────────────────────

const TICKER_SCHEMA = {
  type: "string",
  description: 'Ticker symbol or entity ID (e.g., "AAPL", "BTC").',
} as const;

const SINCE_SCHEMA = {
  type: "string",
  description:
    "Only return items published on or after this ISO 8601 timestamp.",
} as const;

const UNTIL_SCHEMA = {
  type: "string",
  description:
    "Only return items published on or before this ISO 8601 timestamp.",
} as const;

const LIMIT_SCHEMA = {
  type: "number",
  description: "Cap result count (default 20).",
} as const;

const SORT_SCHEMA = {
  type: "string",
  enum: ASC_DESC,
  description: "Sort direction by date (default DESC — newest first).",
} as const;

const OFFSET_SCHEMA = {
  type: "number",
  description: "Skip N rows for pagination (default 0).",
} as const;

// ── Tool definitions ───────────────────────────────────────────────────────

export function buildTools(client: JintelClient): ToolDefinition[] {
  return [
    {
      name: "jintel_quote",
      description:
        "Fetch real-time stock, crypto, and index quotes for one or more tickers. Use for price, change, volume, day range, and market cap. Accepts equity tickers (AAPL, MSFT), crypto (BTC, ETH), and indices (^GSPC). Batch up to many tickers in a single call.",
      inputSchema: {
        type: "object",
        properties: {
          tickers: {
            type: "array",
            description:
              'Ticker symbols to quote (e.g., ["AAPL", "MSFT", "BTC"])',
            items: { type: "string" },
            minItems: 1,
          },
        },
        required: ["tickers"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const tickers = asStringArray(args.tickers, "tickers");
          return runTool(() => client.quotes(tickers));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_search",
      description:
        "Search for entities (companies, people, crypto, commodities, indices) by name, ticker, or keyword. Returns matches with canonical IDs, display names, tickers, and confidence scores. Use before enrich when you only have a company name.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Free-text query (company name, ticker, keyword)",
          },
          type: {
            type: "string",
            description: "Optional entity type filter",
            enum: ENTITY_TYPES,
          },
          limit: {
            type: "number",
            description: "Max results to return",
            minimum: 1,
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const query = asString(args.query, "query");
          const type = asEntityType(args.type, "type");
          const limit = asOptionalNumber(args.limit, "limit");
          return runTool(() => client.searchEntities(query, { type, limit }));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_enrich",
      description:
        "Fetch a full entity profile for a single ticker — market data, fundamentals, news, technicals, regulatory filings, sentiment, ownership, analyst estimates, and more. Use when you want a deep dive on one company or asset. Specify `fields` to reduce payload size.",
      inputSchema: {
        type: "object",
        properties: {
          ticker: {
            type: "string",
            description: 'Ticker symbol (e.g., "AAPL")',
          },
          fields: ENRICHMENT_FIELDS_SCHEMA,
        },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          const fields = asEnrichmentFields(args.fields, "fields");
          return runTool(() => client.enrichEntity(ticker, fields));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_batch_enrich",
      description:
        "Fetch full entity profiles for up to 20 tickers in one call. Preferred over jintel_enrich when analyzing multiple assets — upstream API calls are batched and deduplicated server-side. Specify `fields` to reduce payload size.",
      inputSchema: {
        type: "object",
        properties: {
          tickers: {
            type: "array",
            description: "Ticker symbols (max 20)",
            items: { type: "string" },
            minItems: 1,
            maxItems: 20,
          },
          fields: ENRICHMENT_FIELDS_SCHEMA,
        },
        required: ["tickers"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const tickers = asStringArray(args.tickers, "tickers");
          const fields = asEnrichmentFields(args.fields, "fields");
          return runTool(() => client.batchEnrich(tickers, fields));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_sanctions_screen",
      description:
        "Screen a person or organization name against sanctions lists. Returns matches with severity, match type, and justification. Use for KYC, counterparty checks, or regulatory risk assessment.",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Full legal name of person or entity",
          },
          country: {
            type: "string",
            description: "Optional ISO country code or name to refine match",
          },
        },
        required: ["name"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const name = asString(args.name, "name");
          const country = asOptionalString(args.country, "country");
          return runTool(() => client.sanctionsScreen(name, country));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_price_history",
      description:
        "Fetch OHLCV candle history for up to 20 tickers. Use for backtesting, technical analysis, charting, or volatility studies. Default range is 1y with 1d candles.",
      inputSchema: {
        type: "object",
        properties: {
          tickers: {
            type: "array",
            items: { type: "string" },
            description: "Ticker symbols (max 20)",
            minItems: 1,
            maxItems: 20,
          },
          range: {
            type: "string",
            description:
              'Lookback range: "1d", "5d", "1m", "3m", "6m", "1y", "2y", "5y", "10y", "ytd", "max". Default "1y".',
          },
          interval: {
            type: "string",
            description:
              'Candle interval: "1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1W", "1M", "1Q". Default "1d".',
          },
        },
        required: ["tickers"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const tickers = asStringArray(args.tickers, "tickers");
          const range = asOptionalString(args.range, "range");
          const interval = asOptionalString(args.interval, "interval");
          return runTool(() => client.priceHistory(tickers, range, interval));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_short_interest",
      description:
        "Fetch short interest reports for a US equity ticker. Returns bi-monthly short interest share counts, days-to-cover, and revision history. Use for crowdedness / squeeze analysis.",
      inputSchema: {
        type: "object",
        properties: {
          ticker: {
            type: "string",
            description: 'US equity ticker (e.g., "GME")',
          },
        },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          return runTool(() => client.shortInterest(ticker));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_campaign_finance",
      description:
        "Fetch US campaign finance data (PACs, candidate committees) matching a name. Use for political-exposure checks, donor research, or ESG-adjacent due diligence.",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Committee / candidate / organization name",
          },
          cycle: {
            type: "number",
            description: "Election cycle year (e.g., 2024). Optional.",
          },
        },
        required: ["name"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const name = asString(args.name, "name");
          const cycle = asOptionalNumber(args.cycle, "cycle");
          return runTool(() => client.campaignFinance(name, cycle));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_institutional_holdings",
      description:
        "Fetch institutional 13F holdings for a filer by CIK. Returns positions from the latest 13F-HR filing. Use for tracking what funds own, position sizing, and whale-watching.",
      inputSchema: {
        type: "object",
        properties: {
          cik: {
            type: "string",
            description:
              'Central Index Key of the 13F filer (e.g., "0001067983" for Berkshire)',
          },
          since: {
            type: "string",
            description:
              "ISO 8601 date — only return filings on or after this date",
          },
          until: {
            type: "string",
            description:
              "ISO 8601 date — only return filings on or before this date",
          },
          limit: {
            type: "number",
            description: "Cap holdings returned (default 20)",
          },
          offset: {
            type: "number",
            description: "Skip N rows for pagination (default 0)",
          },
          minValue: {
            type: "number",
            description:
              "Only include holdings with value >= N (thousands of USD)",
          },
          cusip: {
            type: "string",
            description: "Only include holdings matching this CUSIP",
          },
          sort: {
            type: "string",
            enum: ["ASC", "DESC"],
            description: "Sort direction by reportDate (default DESC)",
          },
        },
        required: ["cik"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const cik = asString(args.cik, "cik");
          const since = asOptionalString(args.since, "since");
          const until = asOptionalString(args.until, "until");
          const limit = asOptionalNumber(args.limit, "limit");
          const offset = asOptionalNumber(args.offset, "offset");
          const minValue = asOptionalNumber(args.minValue, "minValue");
          const cusip = asOptionalString(args.cusip, "cusip");
          const sortRaw = asOptionalString(args.sort, "sort");
          const sort: "ASC" | "DESC" | undefined =
            sortRaw === "ASC" || sortRaw === "DESC" ? sortRaw : undefined;
          const hasFilter =
            since != null ||
            until != null ||
            limit != null ||
            offset != null ||
            minValue != null ||
            cusip != null ||
            sort != null;
          const filter = hasFilter
            ? { since, until, limit, offset, minValue, cusip, sort }
            : undefined;
          return runTool(() => client.institutionalHoldings(cik, filter));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_fama_french",
      description:
        "Fetch Fama-French factor returns (market-minus-risk-free, SMB, HML, RMW, CMA, momentum). Use for factor-based risk attribution, academic finance research, or portfolio analysis.",
      inputSchema: {
        type: "object",
        properties: {
          series: {
            type: "string",
            enum: FAMA_FRENCH_SERIES,
            description:
              "Factor series: THREE_FACTOR_DAILY/MONTHLY (Mkt-RF, SMB, HML) or FIVE_FACTOR_DAILY/MONTHLY (adds RMW, CMA)",
          },
          range: {
            type: "string",
            description: 'Lookback range (e.g., "1y", "5y", "max"). Optional.',
          },
        },
        required: ["series"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const series = asFamaFrenchSeries(args.series, "series");
          const range = asOptionalString(args.range, "range");
          return runTool(() => client.famaFrenchFactors(series, range));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_market_status",
      description:
        "Check whether US equity markets are currently open, and get the next open/close times. Use to decide whether to trust intraday prices or to schedule queries.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      handler: async () => {
        return runTool(() => client.marketStatus());
      },
    },

    // ── News / research / sentiment / discussions ─────────────────────────

    {
      name: "jintel_news",
      description:
        "Recent news articles for an entity. Sorted newest first. Filter by source, date range, or sentiment score (-1 to +1).",
      inputSchema: {
        type: "object",
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          sources: {
            type: "array",
            items: { type: "string" },
            description:
              "Restrict to one or more source names (case-insensitive exact match).",
          },
          minSentiment: {
            type: "number",
            description:
              "Only include articles with sentimentScore >= this value (-1 to +1).",
          },
          maxSentiment: {
            type: "number",
            description:
              "Only include articles with sentimentScore <= this value (-1 to +1).",
          },
        },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          const since = asOptionalString(args.since, "since");
          const until = asOptionalString(args.until, "until");
          const limit = asOptionalNumber(args.limit, "limit");
          const sort = asOptionalEnum(args.sort, "sort", ASC_DESC);
          const sources = asOptionalStringArray(args.sources, "sources");
          const minSentiment = asOptionalNumber(
            args.minSentiment,
            "minSentiment",
          );
          const maxSentiment = asOptionalNumber(
            args.maxSentiment,
            "maxSentiment",
          );
          const newsFilter: NewsFilterOptions | undefined =
            since != null ||
            until != null ||
            limit != null ||
            sort != null ||
            sources != null ||
            minSentiment != null ||
            maxSentiment != null
              ? {
                  since,
                  until,
                  limit,
                  sort,
                  sources,
                  minSentiment,
                  maxSentiment,
                }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, "news", { newsFilter }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_research",
      description:
        "Web research articles for an entity (analyst notes, deep dives). Sorted newest first.",
      inputSchema: {
        type: "object",
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
        },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          const filter = buildArrayFilter(args);
          return runTool(() =>
            fetchSubGraph(
              client,
              ticker,
              "research",
              filter ? { filter } : undefined,
            ),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_sentiment",
      description:
        "Aggregated social sentiment for an entity — Reddit / Twitter mentions, upvotes, and 24h momentum. Scalar snapshot, no date filter.",
      inputSchema: {
        type: "object",
        properties: { ticker: TICKER_SCHEMA },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          return runTool(() =>
            fetchSubGraph(client, ticker, "sentiment", undefined),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_social",
      description:
        "Raw social signals for an entity — recent Reddit posts, Twitter mentions, top comments. Use for qualitative retail-sentiment color.",
      inputSchema: {
        type: "object",
        properties: { ticker: TICKER_SCHEMA },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          return runTool(() =>
            fetchSubGraph(client, ticker, "social", undefined),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_discussions",
      description:
        "Hacker News stories mentioning an entity. Filter by points / comments / date.",
      inputSchema: {
        type: "object",
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          minPoints: {
            type: "number",
            description: "Only include stories with points >= this value.",
          },
          minComments: {
            type: "number",
            description: "Only include stories with comments >= this value.",
          },
          offset: OFFSET_SCHEMA,
        },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          const since = asOptionalString(args.since, "since");
          const until = asOptionalString(args.until, "until");
          const limit = asOptionalNumber(args.limit, "limit");
          const sort = asOptionalEnum(args.sort, "sort", ASC_DESC);
          const minPoints = asOptionalNumber(args.minPoints, "minPoints");
          const minComments = asOptionalNumber(args.minComments, "minComments");
          const offset = asOptionalNumber(args.offset, "offset");
          const discussionsFilter: DiscussionsFilterOptions | undefined =
            since != null ||
            until != null ||
            limit != null ||
            sort != null ||
            minPoints != null ||
            minComments != null ||
            offset != null
              ? { since, until, limit, sort, minPoints, minComments, offset }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, "discussions", { discussionsFilter }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_predictions",
      description:
        "Polymarket / Kalshi prediction-market events referencing an entity. Filter by volume, liquidity, or open status.",
      inputSchema: {
        type: "object",
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          minVolume24hr: {
            type: "number",
            description: "Only include events with 24h volume >= this amount.",
          },
          minLiquidity: {
            type: "number",
            description: "Only include events with liquidity >= this amount.",
          },
          onlyOpen: {
            type: "boolean",
            description:
              "Only include events that still have unresolved outcomes.",
          },
          offset: OFFSET_SCHEMA,
        },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          const since = asOptionalString(args.since, "since");
          const until = asOptionalString(args.until, "until");
          const limit = asOptionalNumber(args.limit, "limit");
          const sort = asOptionalEnum(args.sort, "sort", ASC_DESC);
          const minVolume24hr = asOptionalNumber(
            args.minVolume24hr,
            "minVolume24hr",
          );
          const minLiquidity = asOptionalNumber(
            args.minLiquidity,
            "minLiquidity",
          );
          const onlyOpen = asOptionalBoolean(args.onlyOpen, "onlyOpen");
          const offset = asOptionalNumber(args.offset, "offset");
          const predictionsFilter: PredictionMarketFilterOptions | undefined =
            since != null ||
            until != null ||
            limit != null ||
            sort != null ||
            minVolume24hr != null ||
            minLiquidity != null ||
            onlyOpen != null ||
            offset != null
              ? {
                  since,
                  until,
                  limit,
                  sort,
                  minVolume24hr,
                  minLiquidity,
                  onlyOpen,
                  offset,
                }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, "predictions", { predictionsFilter }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    // ── Risk / regulatory ─────────────────────────────────────────────────

    {
      name: "jintel_risk_signals",
      description:
        "Risk signals attached to an entity — sanctions, litigation, regulatory actions, adverse media, PEP. Filter by type, severity, or date.",
      inputSchema: {
        type: "object",
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          types: {
            type: "array",
            items: { type: "string", enum: RISK_SIGNAL_TYPES },
            description: "Restrict to specific risk signal types.",
          },
          severities: {
            type: "array",
            items: { type: "string", enum: SEVERITIES },
            description: "Restrict to specific severities.",
          },
        },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          const since = asOptionalString(args.since, "since");
          const until = asOptionalString(args.until, "until");
          const limit = asOptionalNumber(args.limit, "limit");
          const sort = asOptionalEnum(args.sort, "sort", ASC_DESC);
          const types = asOptionalEnumArray(
            args.types,
            "types",
            RISK_SIGNAL_TYPES,
          );
          const severities = asOptionalEnumArray(
            args.severities,
            "severities",
            SEVERITIES,
          );
          const riskSignalFilter: RiskSignalFilterOptions | undefined =
            since != null ||
            until != null ||
            limit != null ||
            sort != null ||
            types != null ||
            severities != null
              ? { since, until, limit, sort, types, severities }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, "risk", { riskSignalFilter }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_regulatory",
      description:
        "Regulatory data for an entity — SEC filings, sanctions matches, campaign finance. Pass `filingTypes` to narrow filings; default returns all.",
      inputSchema: {
        type: "object",
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          filingTypes: {
            type: "array",
            items: { type: "string", enum: FILING_TYPES },
            description: "Restrict filings to specific form types.",
          },
        },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          const since = asOptionalString(args.since, "since");
          const until = asOptionalString(args.until, "until");
          const limit = asOptionalNumber(args.limit, "limit");
          const sort = asOptionalEnum(args.sort, "sort", ASC_DESC);
          const types = asOptionalEnumArray(
            args.filingTypes,
            "filingTypes",
            FILING_TYPES,
          );
          const filingsFilter: FilingsFilterOptions | undefined =
            since != null ||
            until != null ||
            limit != null ||
            sort != null ||
            types != null
              ? { since, until, limit, sort, types }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, "regulatory", { filingsFilter }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_periodic_filings",
      description:
        "Quarterly / annual SEC filings (10-K, 10-Q, 8-K) for an entity, with summary metadata and links. Sorted newest first.",
      inputSchema: {
        type: "object",
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
        },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          const filter = buildArrayFilter(args);
          return runTool(() =>
            fetchSubGraph(
              client,
              ticker,
              "periodicFilings",
              filter ? { filter } : undefined,
            ),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    // ── Technicals & derivatives ──────────────────────────────────────────

    {
      name: "jintel_technicals",
      description:
        "Technical indicators for a ticker. Returns RSI, MACD, Bollinger Bands (+ width), EMA (10/50/200), SMA (20/50/200), 52-WMA, ATR, VWMA, VWAP, MFI, ADX, Stochastic, OBV, Parabolic SAR, Williams %R, and crossover flags. Interpretation: RSI > 70 overbought / < 30 oversold; MACD histogram > 0 bullish; price > SMA(200) long-term uptrend; ADX > 25 strong trend; ATR rising = increasing volatility.",
      inputSchema: {
        type: "object",
        properties: { ticker: TICKER_SCHEMA },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          return runTool(() =>
            fetchSubGraph(client, ticker, "technicals", undefined),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_derivatives",
      description:
        "Derivatives data for an entity — futures curve and options chain. Best for crypto and major equities. Pass `optionType`, `strikeMin`/`strikeMax`, `minVolume`, or `minOpenInterest` to narrow the options chain (chains can exceed 5 000 rows otherwise).",
      inputSchema: {
        type: "object",
        properties: {
          ticker: TICKER_SCHEMA,
          // Futures
          futuresSince: {
            type: "string",
            description:
              "Only futures expirations on/after this ISO 8601 date.",
          },
          futuresUntil: {
            type: "string",
            description:
              "Only futures expirations on/before this ISO 8601 date.",
          },
          futuresLimit: {
            type: "number",
            description: "Cap futures result count (default 50).",
          },
          futuresSort: {
            type: "string",
            enum: ASC_DESC,
            description:
              "Sort direction by expiration (default ASC — nearest first).",
          },
          // Options
          optionsSince: {
            type: "string",
            description: "Only option expirations on/after this ISO 8601 date.",
          },
          optionsUntil: {
            type: "string",
            description:
              "Only option expirations on/before this ISO 8601 date.",
          },
          strikeMin: {
            type: "number",
            description: "Minimum strike (inclusive).",
          },
          strikeMax: {
            type: "number",
            description: "Maximum strike (inclusive).",
          },
          optionType: {
            type: "string",
            enum: OPTION_TYPES,
            description: "Restrict to CALL or PUT.",
          },
          minVolume: {
            type: "number",
            description: "Drop contracts with volume below this threshold.",
          },
          minOpenInterest: {
            type: "number",
            description:
              "Drop contracts with open interest below this threshold.",
          },
          optionsLimit: {
            type: "number",
            description: "Cap options result count (default 100).",
          },
          optionsSort: {
            type: "string",
            enum: OPTIONS_CHAIN_SORTS,
            description: "Options chain sort order (default EXPIRATION_ASC).",
          },
        },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          const futuresSince = asOptionalString(
            args.futuresSince,
            "futuresSince",
          );
          const futuresUntil = asOptionalString(
            args.futuresUntil,
            "futuresUntil",
          );
          const futuresLimit = asOptionalNumber(
            args.futuresLimit,
            "futuresLimit",
          );
          const futuresSort = asOptionalEnum(
            args.futuresSort,
            "futuresSort",
            ASC_DESC,
          );
          const futuresFilter: FuturesCurveFilterOptions | undefined =
            futuresSince != null ||
            futuresUntil != null ||
            futuresLimit != null ||
            futuresSort != null
              ? {
                  since: futuresSince,
                  until: futuresUntil,
                  limit: futuresLimit,
                  sort: futuresSort,
                }
              : undefined;
          const optionsSince = asOptionalString(
            args.optionsSince,
            "optionsSince",
          );
          const optionsUntil = asOptionalString(
            args.optionsUntil,
            "optionsUntil",
          );
          const strikeMin = asOptionalNumber(args.strikeMin, "strikeMin");
          const strikeMax = asOptionalNumber(args.strikeMax, "strikeMax");
          const optionType = asOptionalEnum(
            args.optionType,
            "optionType",
            OPTION_TYPES,
          );
          const minVolume = asOptionalNumber(args.minVolume, "minVolume");
          const minOpenInterest = asOptionalNumber(
            args.minOpenInterest,
            "minOpenInterest",
          );
          const optionsLimit = asOptionalNumber(
            args.optionsLimit,
            "optionsLimit",
          );
          const optionsSort = asOptionalEnum(
            args.optionsSort,
            "optionsSort",
            OPTIONS_CHAIN_SORTS,
          );
          const optionsFilter: OptionsChainFilterOptions | undefined =
            optionsSince != null ||
            optionsUntil != null ||
            strikeMin != null ||
            strikeMax != null ||
            optionType != null ||
            minVolume != null ||
            minOpenInterest != null ||
            optionsLimit != null ||
            optionsSort != null
              ? {
                  since: optionsSince,
                  until: optionsUntil,
                  strikeMin,
                  strikeMax,
                  optionType,
                  minVolume,
                  minOpenInterest,
                  limit: optionsLimit,
                  sort: optionsSort,
                }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, "derivatives", {
              futuresFilter,
              optionsFilter,
            }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    // ── Ownership & holdings ──────────────────────────────────────────────

    {
      name: "jintel_ownership",
      description:
        "Ownership breakdown for an entity — institutional %, insider %, retail %, float, and shares outstanding. Scalar snapshot.",
      inputSchema: {
        type: "object",
        properties: { ticker: TICKER_SCHEMA },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          return runTool(() =>
            fetchSubGraph(client, ticker, "ownership", undefined),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_top_holders",
      description:
        "Top institutional holders of an entity (by shares held). Filter by minimum position value or paginate with offset.",
      inputSchema: {
        type: "object",
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          minValue: {
            type: "number",
            description:
              "Only include holders with position value >= this amount (USD).",
          },
          offset: OFFSET_SCHEMA,
        },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          const since = asOptionalString(args.since, "since");
          const until = asOptionalString(args.until, "until");
          const limit = asOptionalNumber(args.limit, "limit");
          const sort = asOptionalEnum(args.sort, "sort", ASC_DESC);
          const minValue = asOptionalNumber(args.minValue, "minValue");
          const offset = asOptionalNumber(args.offset, "offset");
          const topHoldersFilter: TopHoldersFilterOptions | undefined =
            since != null ||
            until != null ||
            limit != null ||
            sort != null ||
            minValue != null ||
            offset != null
              ? { since, until, limit, sort, minValue, offset }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, "topHolders", { topHoldersFilter }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_insider_trades",
      description:
        "Insider Form 4 transactions for an entity — purchases, sales, option exercises by officers, directors, and 10% owners. Filter by transaction code, role, or 10b5-1 plan status.",
      inputSchema: {
        type: "object",
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          isOfficer: {
            type: "boolean",
            description: "Only include transactions by officers.",
          },
          isDirector: {
            type: "boolean",
            description: "Only include transactions by directors.",
          },
          isTenPercentOwner: {
            type: "boolean",
            description: "Only include transactions by 10% owners.",
          },
          onlyUnder10b5One: {
            type: "boolean",
            description:
              "Only include transactions made under a Rule 10b5-1 trading plan.",
          },
          transactionCodes: {
            type: "array",
            items: { type: "string" },
            description:
              "Restrict to one or more Form 4 transaction codes (P, S, A, F, M, G, J, D).",
          },
          acquiredDisposed: {
            type: "string",
            enum: ACQUISITION_DIRECTIONS,
            description:
              "Restrict to acquisitions (ACQUIRED) or disposals (DISPOSED).",
          },
          minValue: {
            type: "number",
            description:
              "Only include transactions with transactionValue >= this amount (USD).",
          },
        },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          const since = asOptionalString(args.since, "since");
          const until = asOptionalString(args.until, "until");
          const limit = asOptionalNumber(args.limit, "limit");
          const sort = asOptionalEnum(args.sort, "sort", ASC_DESC);
          const isOfficer = asOptionalBoolean(args.isOfficer, "isOfficer");
          const isDirector = asOptionalBoolean(args.isDirector, "isDirector");
          const isTenPercentOwner = asOptionalBoolean(
            args.isTenPercentOwner,
            "isTenPercentOwner",
          );
          const onlyUnder10b5One = asOptionalBoolean(
            args.onlyUnder10b5One,
            "onlyUnder10b5One",
          );
          const transactionCodes = asOptionalStringArray(
            args.transactionCodes,
            "transactionCodes",
          );
          const acquiredDisposed = asOptionalEnum(
            args.acquiredDisposed,
            "acquiredDisposed",
            ACQUISITION_DIRECTIONS,
          );
          const minValue = asOptionalNumber(args.minValue, "minValue");
          const insiderTradesFilter: InsiderTradeFilterOptions | undefined =
            since != null ||
            until != null ||
            limit != null ||
            sort != null ||
            isOfficer != null ||
            isDirector != null ||
            isTenPercentOwner != null ||
            onlyUnder10b5One != null ||
            transactionCodes != null ||
            acquiredDisposed != null ||
            minValue != null
              ? {
                  since,
                  until,
                  limit,
                  sort,
                  isOfficer,
                  isDirector,
                  isTenPercentOwner,
                  onlyUnder10b5One,
                  transactionCodes,
                  acquiredDisposed,
                  minValue,
                }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, "insiderTrades", {
              insiderTradesFilter,
            }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    // ── Fundamentals / financials ────────────────────────────────────────

    {
      name: "jintel_financials",
      description:
        "Income statement, balance sheet, and cash flow statement for an entity. Pass `periodTypes` (e.g. ['12M'] for annual only, ['3M'] for quarterly only) to filter periods.",
      inputSchema: {
        type: "object",
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          periodTypes: {
            type: "array",
            items: { type: "string" },
            description:
              "Restrict to period-type codes as reported upstream (e.g. ['12M'] annual, ['3M'] quarterly).",
          },
        },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          const since = asOptionalString(args.since, "since");
          const until = asOptionalString(args.until, "until");
          const limit = asOptionalNumber(args.limit, "limit");
          const sort = asOptionalEnum(args.sort, "sort", ASC_DESC);
          const periodTypes = asOptionalStringArray(
            args.periodTypes,
            "periodTypes",
          );
          const financialStatementsFilter:
            | FinancialStatementFilterOptions
            | undefined =
            since != null ||
            until != null ||
            limit != null ||
            sort != null ||
            periodTypes != null
              ? { since, until, limit, sort, periodTypes }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, "financials", {
              financialStatementsFilter,
            }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_executives",
      description:
        "Key executives and named officers for an entity, with annual compensation. Filter by minimum pay or sort order.",
      inputSchema: {
        type: "object",
        properties: {
          ticker: TICKER_SCHEMA,
          minPay: {
            type: "number",
            description:
              "Only return executives with annual pay >= this amount (USD). Null pay values excluded when set.",
          },
          limit: LIMIT_SCHEMA,
          sortBy: {
            type: "string",
            enum: EXECUTIVE_SORTS,
            description: "Sort order (default PAY_DESC).",
          },
        },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          const minPay = asOptionalNumber(args.minPay, "minPay");
          const limit = asOptionalNumber(args.limit, "limit");
          const sortBy = asOptionalEnum(args.sortBy, "sortBy", EXECUTIVE_SORTS);
          const executivesFilter: ExecutivesFilterOptions | undefined =
            minPay != null || limit != null || sortBy != null
              ? { minPay, limit, sortBy }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, "executives", { executivesFilter }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_earnings_calendar",
      description:
        "Earnings calendar / report history for an entity — past and upcoming. Each entry includes EPS estimate vs. actual, revenue, and surprise. Sorted newest first by default.",
      inputSchema: {
        type: "object",
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
        },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          const since = asOptionalString(args.since, "since");
          const until = asOptionalString(args.until, "until");
          const limit = asOptionalNumber(args.limit, "limit");
          const sort = asOptionalEnum(args.sort, "sort", ASC_DESC);
          const earningsFilter: EarningsFilterOptions | undefined =
            since != null || until != null || limit != null || sort != null
              ? { since, until, limit, sort }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, "earnings", { earningsFilter }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_earnings_press_releases",
      description:
        "Earnings press releases (with summaries and links) for an entity. Sorted newest first.",
      inputSchema: {
        type: "object",
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
        },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          const filter = buildArrayFilter(args);
          return runTool(() =>
            fetchSubGraph(
              client,
              ticker,
              "earningsPressReleases",
              filter ? { filter } : undefined,
            ),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_segmented_revenue",
      description:
        "Revenue breakdown by product, segment, geography, or customer for an entity. Use to understand business mix and concentration.",
      inputSchema: {
        type: "object",
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          dimensions: {
            type: "array",
            items: { type: "string", enum: SEGMENT_DIMENSIONS },
            description: "Restrict to one or more breakdown dimensions.",
          },
          minValue: {
            type: "number",
            description: "Only include rows with revenue >= this amount (USD).",
          },
        },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          const since = asOptionalString(args.since, "since");
          const until = asOptionalString(args.until, "until");
          const limit = asOptionalNumber(args.limit, "limit");
          const sort = asOptionalEnum(args.sort, "sort", ASC_DESC);
          const dimensions = asOptionalEnumArray(
            args.dimensions,
            "dimensions",
            SEGMENT_DIMENSIONS,
          );
          const minValue = asOptionalNumber(args.minValue, "minValue");
          const segmentedRevenueFilter:
            | SegmentRevenueFilterOptions
            | undefined =
            since != null ||
            until != null ||
            limit != null ||
            sort != null ||
            dimensions != null ||
            minValue != null
              ? { since, until, limit, sort, dimensions, minValue }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, "segmentedRevenue", {
              segmentedRevenueFilter,
            }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_analyst_consensus",
      description:
        "Wall Street analyst consensus for an entity — recommendation, price target, EPS / revenue estimates, number of analysts. Scalar snapshot.",
      inputSchema: {
        type: "object",
        properties: { ticker: TICKER_SCHEMA },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          return runTool(() =>
            fetchSubGraph(client, ticker, "analyst", undefined),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    // ── Healthcare / legal / contracts ───────────────────────────────────

    {
      name: "jintel_clinical_trials",
      description:
        "Clinical trial registrations referencing an entity (sponsor or drug). Filter by phase or status. Sorted newest first.",
      inputSchema: {
        type: "object",
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          phase: {
            type: "string",
            description:
              "Case-insensitive phase match (e.g. 'PHASE3' or 'PHASE').",
          },
          status: {
            type: "string",
            description: "Exact status match (e.g. 'RECRUITING', 'COMPLETED').",
          },
          offset: OFFSET_SCHEMA,
        },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          const since = asOptionalString(args.since, "since");
          const until = asOptionalString(args.until, "until");
          const limit = asOptionalNumber(args.limit, "limit");
          const sort = asOptionalEnum(args.sort, "sort", ASC_DESC);
          const phase = asOptionalString(args.phase, "phase");
          const status = asOptionalString(args.status, "status");
          const offset = asOptionalNumber(args.offset, "offset");
          const clinicalTrialsFilter: ClinicalTrialFilterOptions | undefined =
            since != null ||
            until != null ||
            limit != null ||
            sort != null ||
            phase != null ||
            status != null ||
            offset != null
              ? { since, until, limit, sort, phase, status, offset }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, "clinicalTrials", {
              clinicalTrialsFilter,
            }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_fda_events",
      description:
        "FDA adverse events and recalls referencing an entity. Filter by event type (DRUG_ADVERSE / DEVICE_ADVERSE / DRUG_RECALL) or severity (e.g. 'CLASS I').",
      inputSchema: {
        type: "object",
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          types: {
            type: "array",
            items: { type: "string", enum: FDA_EVENT_TYPES },
            description: "Restrict to one or more event kinds.",
          },
          severity: {
            type: "string",
            description:
              "Exact severity match — 'CLASS I' / 'CLASS II' / 'CLASS III' for recalls, or outcome flag for adverse events.",
          },
          offset: OFFSET_SCHEMA,
        },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          const since = asOptionalString(args.since, "since");
          const until = asOptionalString(args.until, "until");
          const limit = asOptionalNumber(args.limit, "limit");
          const sort = asOptionalEnum(args.sort, "sort", ASC_DESC);
          const types = asOptionalEnumArray(
            args.types,
            "types",
            FDA_EVENT_TYPES,
          );
          const severity = asOptionalString(args.severity, "severity");
          const offset = asOptionalNumber(args.offset, "offset");
          const fdaEventsFilter: FdaEventFilterOptions | undefined =
            since != null ||
            until != null ||
            limit != null ||
            sort != null ||
            types != null ||
            severity != null ||
            offset != null
              ? { since, until, limit, sort, types, severity, offset }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, "fdaEvents", { fdaEventsFilter }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_litigation",
      description:
        "Active and historical lawsuits involving an entity. Filter by court, nature of suit, or active status.",
      inputSchema: {
        type: "object",
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          onlyActive: {
            type: "boolean",
            description:
              "Only include cases with no termination date (still open).",
          },
          court: {
            type: "string",
            description:
              "Case-insensitive substring match against court name (e.g. 'N.D. CAL').",
          },
          natureOfSuit: {
            type: "string",
            description:
              "Case-insensitive substring match (e.g. 'PATENT', 'ANTITRUST').",
          },
          offset: OFFSET_SCHEMA,
        },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          const since = asOptionalString(args.since, "since");
          const until = asOptionalString(args.until, "until");
          const limit = asOptionalNumber(args.limit, "limit");
          const sort = asOptionalEnum(args.sort, "sort", ASC_DESC);
          const onlyActive = asOptionalBoolean(args.onlyActive, "onlyActive");
          const court = asOptionalString(args.court, "court");
          const natureOfSuit = asOptionalString(
            args.natureOfSuit,
            "natureOfSuit",
          );
          const offset = asOptionalNumber(args.offset, "offset");
          const litigationFilter: LitigationFilterOptions | undefined =
            since != null ||
            until != null ||
            limit != null ||
            sort != null ||
            onlyActive != null ||
            court != null ||
            natureOfSuit != null ||
            offset != null
              ? {
                  since,
                  until,
                  limit,
                  sort,
                  onlyActive,
                  court,
                  natureOfSuit,
                  offset,
                }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, "litigation", { litigationFilter }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_government_contracts",
      description:
        "US government contracts awarded to an entity. Filter by minimum dollar amount or paginate.",
      inputSchema: {
        type: "object",
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          minAmount: {
            type: "number",
            description:
              "Only include contracts with amount >= this value (USD).",
          },
          offset: OFFSET_SCHEMA,
        },
        required: ["ticker"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          const since = asOptionalString(args.since, "since");
          const until = asOptionalString(args.until, "until");
          const limit = asOptionalNumber(args.limit, "limit");
          const sort = asOptionalEnum(args.sort, "sort", ASC_DESC);
          const minAmount = asOptionalNumber(args.minAmount, "minAmount");
          const offset = asOptionalNumber(args.offset, "offset");
          const governmentContractsFilter:
            | GovernmentContractFilterOptions
            | undefined =
            since != null ||
            until != null ||
            limit != null ||
            sort != null ||
            minAmount != null ||
            offset != null
              ? { since, until, limit, sort, minAmount, offset }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, "governmentContracts", {
              governmentContractsFilter,
            }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    // ── Macro economics ──────────────────────────────────────────────────

    {
      name: "jintel_gdp",
      description:
        "GDP time series for a country. Pass `type` to choose REAL (inflation-adjusted), NOMINAL (current dollars), or FORECAST (forward estimates). Filter the historical observations with `since` / `until` / `limit`.",
      inputSchema: {
        type: "object",
        properties: {
          country: {
            type: "string",
            description:
              "Country name or ISO code (e.g., 'US', 'United States').",
          },
          type: {
            type: "string",
            enum: GDP_TYPES,
            description:
              "GDP series type: REAL (inflation-adjusted), NOMINAL (current $), FORECAST (forward).",
          },
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
        },
        required: ["country"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const country = asString(args.country, "country");
          const type = asOptionalEnum(args.type, "type", GDP_TYPES);
          const filter = buildArrayFilter(args);
          return runTool(() => client.gdp(country, type, filter));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_inflation",
      description:
        "CPI / inflation time series for a country. Filter the observations with `since` / `until` / `limit`.",
      inputSchema: {
        type: "object",
        properties: {
          country: {
            type: "string",
            description: "Country name or ISO code (e.g., 'US').",
          },
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
        },
        required: ["country"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const country = asString(args.country, "country");
          const filter = buildArrayFilter(args);
          return runTool(() => client.inflation(country, filter));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_interest_rates",
      description:
        "Policy interest rates time series for a country (e.g. Fed Funds for US). Filter the observations with `since` / `until` / `limit`.",
      inputSchema: {
        type: "object",
        properties: {
          country: {
            type: "string",
            description: "Country name or ISO code (e.g., 'US').",
          },
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
        },
        required: ["country"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const country = asString(args.country, "country");
          const filter = buildArrayFilter(args);
          return runTool(() => client.interestRates(country, filter));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_sp500_multiples",
      description:
        "S&P 500 valuation multiples time series — PE, Shiller PE (CAPE), dividend yield, earnings yield. Use for valuation-cycle analysis.",
      inputSchema: {
        type: "object",
        properties: {
          series: {
            type: "string",
            enum: SP500_SERIES,
            description:
              "Multiple series: PE_MONTH, SHILLER_PE_MONTH (CAPE), DIVIDEND_YIELD_MONTH, EARNINGS_YIELD_MONTH.",
          },
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
        },
        required: ["series"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const series = asEnum(args.series, "series", SP500_SERIES);
          const filter = buildArrayFilter(args);
          return runTool(() => client.sp500Multiples(series, filter));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: "jintel_macro_series",
      description:
        "Generic US macro time series by series ID (FRED-style codes — e.g. GDPC1, UNRATE, CPIAUCSL, T10Y2Y, DGS10). Returns metadata + observations. Pass an array via `seriesIds` to fetch multiple series in one call.",
      inputSchema: {
        type: "object",
        properties: {
          seriesId: {
            type: "string",
            description: "Single macro series ID (e.g., 'UNRATE', 'CPIAUCSL').",
          },
          seriesIds: {
            type: "array",
            items: { type: "string" },
            description: "Batch — multiple series IDs in one call.",
          },
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
        },
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const seriesId = asOptionalString(args.seriesId, "seriesId");
          const seriesIds = asOptionalStringArray(args.seriesIds, "seriesIds");
          if (seriesId == null && seriesIds == null) {
            return fail("Argument 'seriesId' or 'seriesIds' must be provided");
          }
          if (seriesId != null && seriesIds != null) {
            return fail("Pass either 'seriesId' or 'seriesIds', not both");
          }
          const filter = buildArrayFilter(args);
          if (seriesIds != null) {
            return runTool(() => client.macroSeriesBatch(seriesIds, filter));
          }
          return runTool(() => client.macroSeries(seriesId!, filter));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    // ── Compact aggregator ───────────────────────────────────────────────

    {
      name: "jintel_query",
      description:
        "Compact dispatcher — single tool that fetches any per-entity sub-graph by `kind`. Use when you want to keep your agent's tool list short. For filtered results (date ranges, types, severities), prefer the dedicated tool (jintel_news, jintel_executives, etc.) — this aggregator only supports `since` / `until` / `limit` on array sub-graphs.",
      inputSchema: {
        type: "object",
        properties: {
          ticker: TICKER_SCHEMA,
          kind: {
            type: "string",
            enum: [
              "market",
              "fundamentals",
              "news",
              "research",
              "sentiment",
              "social",
              "discussions",
              "predictions",
              "technicals",
              "derivatives",
              "risk",
              "regulatory",
              "periodic_filings",
              "ownership",
              "top_holders",
              "institutional_holdings",
              "insider_trades",
              "financials",
              "executives",
              "earnings_press_releases",
              "segmented_revenue",
              "earnings_calendar",
              "analyst_consensus",
              "clinical_trials",
              "fda_events",
              "litigation",
              "government_contracts",
            ],
            description: "Which sub-graph to fetch.",
          },
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
        },
        required: ["ticker", "kind"],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, "ticker");
          const kind = asString(args.kind, "kind");
          const since = asOptionalString(args.since, "since");
          const until = asOptionalString(args.until, "until");
          const limit = asOptionalNumber(args.limit, "limit");
          const arrayFilter: ArraySubGraphOptions | undefined =
            since != null || until != null || limit != null
              ? { since, until, limit }
              : undefined;

          // Route to the appropriate sub-graph. Each branch must be exhaustive —
          // if you add a `kind`, also add a case here.
          switch (kind) {
            case "market":
              return runTool(() =>
                fetchSubGraph(client, ticker, "market", undefined),
              );
            case "fundamentals":
            case "financials":
              return runTool(() =>
                fetchSubGraph(client, ticker, "financials", undefined),
              );
            case "news":
              return runTool(() =>
                fetchSubGraph(client, ticker, "news", {
                  newsFilter: arrayFilter,
                }),
              );
            case "research":
              return runTool(() =>
                fetchSubGraph(client, ticker, "research", {
                  filter: arrayFilter,
                }),
              );
            case "sentiment":
              return runTool(() =>
                fetchSubGraph(client, ticker, "sentiment", undefined),
              );
            case "social":
              return runTool(() =>
                fetchSubGraph(client, ticker, "social", undefined),
              );
            case "discussions":
              return runTool(() =>
                fetchSubGraph(client, ticker, "discussions", {
                  discussionsFilter: arrayFilter,
                }),
              );
            case "predictions":
              return runTool(() =>
                fetchSubGraph(client, ticker, "predictions", {
                  predictionsFilter: arrayFilter,
                }),
              );
            case "technicals":
              return runTool(() =>
                fetchSubGraph(client, ticker, "technicals", undefined),
              );
            case "derivatives":
              return runTool(() =>
                fetchSubGraph(client, ticker, "derivatives", undefined),
              );
            case "risk":
              return runTool(() =>
                fetchSubGraph(client, ticker, "risk", {
                  riskSignalFilter: arrayFilter,
                }),
              );
            case "regulatory":
              return runTool(() =>
                fetchSubGraph(client, ticker, "regulatory", {
                  filingsFilter: arrayFilter,
                }),
              );
            case "periodic_filings":
              return runTool(() =>
                fetchSubGraph(client, ticker, "periodicFilings", {
                  filter: arrayFilter,
                }),
              );
            case "ownership":
              return runTool(() =>
                fetchSubGraph(client, ticker, "ownership", undefined),
              );
            case "top_holders":
              return runTool(() =>
                fetchSubGraph(client, ticker, "topHolders", {
                  topHoldersFilter: arrayFilter,
                }),
              );
            case "institutional_holdings":
              return runTool(() =>
                fetchSubGraph(client, ticker, "institutionalHoldings", {
                  institutionalHoldingsFilter: arrayFilter,
                }),
              );
            case "insider_trades":
              return runTool(() =>
                fetchSubGraph(client, ticker, "insiderTrades", {
                  insiderTradesFilter: arrayFilter,
                }),
              );
            case "executives":
              return runTool(() =>
                fetchSubGraph(client, ticker, "executives", undefined),
              );
            case "earnings_press_releases":
              return runTool(() =>
                fetchSubGraph(client, ticker, "earningsPressReleases", {
                  filter: arrayFilter,
                }),
              );
            case "segmented_revenue":
              return runTool(() =>
                fetchSubGraph(client, ticker, "segmentedRevenue", {
                  segmentedRevenueFilter: arrayFilter,
                }),
              );
            case "earnings_calendar":
              return runTool(() =>
                fetchSubGraph(client, ticker, "earnings", {
                  earningsFilter: arrayFilter,
                }),
              );
            case "analyst_consensus":
              return runTool(() =>
                fetchSubGraph(client, ticker, "analyst", undefined),
              );
            case "clinical_trials":
              return runTool(() =>
                fetchSubGraph(client, ticker, "clinicalTrials", {
                  clinicalTrialsFilter: arrayFilter,
                }),
              );
            case "fda_events":
              return runTool(() =>
                fetchSubGraph(client, ticker, "fdaEvents", {
                  fdaEventsFilter: arrayFilter,
                }),
              );
            case "litigation":
              return runTool(() =>
                fetchSubGraph(client, ticker, "litigation", {
                  litigationFilter: arrayFilter,
                }),
              );
            case "government_contracts":
              return runTool(() =>
                fetchSubGraph(client, ticker, "governmentContracts", {
                  governmentContractsFilter: arrayFilter,
                }),
              );
            default:
              return fail(`Unsupported kind: ${kind}`);
          }
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },
  ];
}
