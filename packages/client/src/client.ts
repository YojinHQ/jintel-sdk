import type { z } from 'zod';
import {
  QUOTES,
  PRICE_HISTORY,
  SANCTIONS_SCREEN,
  SEARCH_ENTITIES,
  FAMA_FRENCH_FACTORS,
  SHORT_INTEREST,
  CAMPAIGN_FINANCE,
  MARKET_STATUS,
  INSTITUTIONAL_HOLDINGS,
  GDP,
  INFLATION,
  INTEREST_RATES,
  SP500_MULTIPLES,
  buildBatchEnrichQuery,
  buildEnrichQuery,
} from './queries.js';
import type {
  ArraySubGraphOptions,
  CampaignFinanceFilterOptions,
  EconomicDataPoint,
  EnrichmentField,
  Entity,
  EntityType,
  FamaFrenchSeries,
  FactorDataPoint,
  GdpType,
  GraphQLError,
  GraphQLResponse,
  InstitutionalHolding,
  InstitutionalHoldingsFilterOptions,
  JintelClientCacheConfig,
  JintelClientConfig,
  MarketQuote,
  PACCommittee,
  RequestOptions,
  SanctionsFilterOptions,
  SanctionsMatch,
  ShortInterestReport,
  SP500DataPoint,
  SP500Series,
  TickerPriceHistory,
  USMarketStatus,
} from './types.js';
import { ALL_ENRICHMENT_FIELDS, GraphQLResponseSchema } from './types.js';
import type { EnrichOptions } from './types.js';

// ── Filter Variables ──────────────────────────────────────────────────────────

/**
 * Map EnrichOptions onto the GraphQL variables object expected by the query builder.
 * Only includes variables for filters that were actually set, matching what
 * `buildEnrichQuery` / `buildBatchEnrichQuery` declare.
 */
function enrichFilterVariables(options?: EnrichOptions): Record<string, unknown> {
  if (!options) return {};
  const vars: Record<string, unknown> = {};
  if (options.filter) vars.filter = options.filter;
  if (options.filingsFilter) vars.filingsFilter = options.filingsFilter;
  if (options.riskSignalFilter) vars.riskSignalFilter = options.riskSignalFilter;
  if (options.futuresFilter) vars.futuresFilter = options.futuresFilter;
  if (options.optionsFilter) vars.optionsFilter = options.optionsFilter;
  if (options.newsFilter) vars.newsFilter = options.newsFilter;
  if (options.executivesFilter) vars.executivesFilter = options.executivesFilter;
  if (options.insiderTradesFilter) vars.insiderTradesFilter = options.insiderTradesFilter;
  if (options.earningsFilter) vars.earningsFilter = options.earningsFilter;
  if (options.segmentedRevenueFilter) vars.segmentedRevenueFilter = options.segmentedRevenueFilter;
  if (options.topHoldersFilter) vars.topHoldersFilter = options.topHoldersFilter;
  if (options.institutionalHoldingsFilter) vars.institutionalHoldingsFilter = options.institutionalHoldingsFilter;
  if (options.predictionsFilter) vars.predictionsFilter = options.predictionsFilter;
  if (options.discussionsFilter) vars.discussionsFilter = options.discussionsFilter;
  if (options.financialStatementsFilter) vars.financialStatementsFilter = options.financialStatementsFilter;
  if (options.sanctionsFilter) vars.sanctionsFilter = options.sanctionsFilter;
  if (options.campaignFinanceFilter) vars.campaignFinanceFilter = options.campaignFinanceFilter;
  return vars;
}

// ── Response Cache ────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const DEFAULT_QUOTES_TTL = 30_000;
const DEFAULT_ENRICH_TTL = 300_000;
const DEFAULT_PRICE_HISTORY_TTL = 300_000;

class ResponseCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly quotesTtl: number;
  private readonly enrichTtl: number;
  private readonly priceHistoryTtl: number;

  constructor(config: JintelClientCacheConfig) {
    this.quotesTtl = config.quotesTtlMs ?? DEFAULT_QUOTES_TTL;
    this.enrichTtl = config.enrichTtlMs ?? DEFAULT_ENRICH_TTL;
    this.priceHistoryTtl = config.priceHistoryTtlMs ?? DEFAULT_PRICE_HISTORY_TTL;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  quoteKey(tickers: string[]): string {
    return `q:${[...tickers].sort().join(',')}`;
  }

  enrichKey(tickers: string[], fields: EnrichmentField[]): string {
    return `e:${[...tickers].sort().join(',')}:${[...fields].sort().join(',')}`;
  }

  priceHistoryKey(tickers: string[], range?: string, interval?: string): string {
    return `ph:${[...tickers].sort().join(',')}:${range ?? ''}:${interval ?? ''}`;
  }

  /**
   * Remove all cached entries whose key contains any of the given tickers.
   * Covers both `q:` (quotes) and `e:` (enrich) prefixes since both embed
   * tickers in the key. Typically called after data invalidation events
   * (e.g. new signals ingested for a watchlist ticker).
   */
  invalidateTickers(tickers: string[]): void {
    const upper = tickers.map((t) => t.toUpperCase());
    for (const key of this.store.keys()) {
      if (upper.some((t) => key.includes(t))) {
        this.store.delete(key);
      }
    }
  }

  get quotesTtlMs(): number {
    return this.quotesTtl;
  }
  get enrichTtlMs(): number {
    return this.enrichTtl;
  }
  get priceHistoryTtlMs(): number {
    return this.priceHistoryTtl;
  }
}

// ── Query Validation ─────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateQuery(query: string): ValidationResult {
  const errors: string[] = [];
  const trimmed = (query ?? '').trim();

  if (!trimmed) {
    return { valid: false, errors: ['Query string is empty'] };
  }

  // Must start with a valid operation keyword or shorthand '{'
  const operationPattern = /^(query|mutation|subscription)\b|^\{/;
  if (!operationPattern.test(trimmed)) {
    errors.push("Query must start with 'query', 'mutation', 'subscription', or '{'");
  }

  // Check balanced braces, accounting for strings
  let depth = 0;
  let inString = false;
  let escapeNext = false;
  for (const char of trimmed) {
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === '{') depth++;
    if (char === '}') depth--;
    if (depth < 0) {
      errors.push("Unexpected closing brace '}'");
      break;
    }
  }
  if (depth > 0) {
    errors.push(`${depth} unclosed brace(s) '{'`);
  }
  if (inString) {
    errors.push('Unterminated string literal');
  }

  // Check for empty selection set
  if (/\{\s*\}/.test(trimmed)) {
    errors.push('Empty selection set detected');
  }

  return { valid: errors.length === 0, errors };
}

// ── Error Classes ─────────────────────────────────────────────────────────

export class JintelError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'JintelError';
    this.code = code;
  }
}

export class JintelAuthError extends JintelError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR');
    this.name = 'JintelAuthError';
  }
}

export class JintelUnreachableError extends JintelError {
  constructor(message: string) {
    super(message, 'UNREACHABLE');
    this.name = 'JintelUnreachableError';
  }
}

export class JintelValidationError extends JintelError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'JintelValidationError';
  }
}

// ── Result Types ──────────────────────────────────────────────────────────

export type JintelResult<T> = { success: true; data: T } | { success: false; error: string };

export interface GraphQLRequestResult<T = unknown> {
  data: T;
  errors?: GraphQLError[];
  extensions?: GraphQLResponse['extensions'];
}

// ── Client ────────────────────────────────────────────────────────────────

export const JINTEL_API_URL = 'https://api.jintel.ai/api';

export class JintelClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly debug: boolean;
  private readonly responseCache?: ResponseCache;

  constructor(config: JintelClientConfig) {
    if (!config.apiKey) {
      throw new JintelAuthError('apiKey is required and must not be empty');
    }
    this.baseUrl = config.baseUrl ?? JINTEL_API_URL;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? 30_000;
    this.debug = config.debug ?? false;
    if (config.cache) {
      this.responseCache = new ResponseCache(config.cache === true ? {} : config.cache);
    }
  }

  // ── Private ─────────────────────────────────────────────────────────────

  private async execute(query: string, variables?: Record<string, unknown>): Promise<GraphQLResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
    if (this.debug) {
      headers['X-Debug'] = 'true';
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/graphql`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(this.timeout),
      });
    } catch (err) {
      if (err instanceof TypeError) {
        throw new JintelUnreachableError(`Jintel API unreachable: ${err.message}`);
      }
      throw err;
    }

    if (response.status === 401) {
      throw new JintelAuthError('Authentication failed: invalid or expired API key');
    }

    if (!response.ok) {
      throw new JintelError(`HTTP ${response.status}: ${response.statusText}`, `HTTP_${response.status}`);
    }

    const json: unknown = await response.json();
    return GraphQLResponseSchema.parse(json);
  }

  private handleError<T>(err: unknown): JintelResult<T> {
    if (err instanceof JintelError) {
      return { success: false, error: err.message };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }

  // ── Generic Public API ──────────────────────────────────────────────────

  /**
   * Execute any GraphQL query. Throws on HTTP, auth, and GraphQL errors.
   * Auto-extracts the data when the response has a single root field.
   *
   * @example
   * ```ts
   * // Untyped
   * const quotes = await client.request(QUOTES, { tickers: ["AAPL"] });
   *
   * // Typed via generic
   * const quotes = await client.request<MarketQuote[]>(QUOTES, { tickers: ["AAPL"] });
   *
   * // Typed + validated via Zod schema
   * const quotes = await client.request(QUOTES, { tickers: ["AAPL"] }, {
   *   schema: z.array(MarketQuoteSchema),
   * });
   * ```
   */
  async request<T = unknown>(
    query: string,
    variables?: Record<string, unknown>,
    options?: RequestOptions<T>,
  ): Promise<T> {
    const response = await this.execute(query, variables);

    if (response.errors?.length) {
      const firstError = response.errors[0];
      const code = firstError.extensions?.code;
      if (code === 'UNAUTHENTICATED') {
        throw new JintelAuthError(firstError.message);
      }
      throw new JintelError(firstError.message, code ?? undefined);
    }

    const data = response.data as Record<string, unknown> | null;
    if (!data) {
      throw new JintelError('No data returned', 'NO_DATA');
    }

    // Extract by key, or auto-extract single root field
    let result: unknown;
    if (options?.key) {
      result = data[options.key];
    } else {
      const keys = Object.keys(data);
      result = keys.length === 1 ? data[keys[0]] : data;
    }

    if (options?.schema) {
      const parsed = (options.schema as z.ZodType).safeParse(result);
      if (!parsed.success) {
        throw new JintelValidationError(`Response validation failed: ${parsed.error.message}`);
      }
      return parsed.data as T;
    }

    return result as T;
  }

  /**
   * Execute a GraphQL query and return the full response including errors and extensions.
   * Does NOT throw on GraphQL errors — use this when you want to handle errors yourself.
   */
  async rawRequest<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<GraphQLRequestResult<T>> {
    const response = await this.execute(query, variables);

    return {
      data: (response.data ?? null) as T,
      errors: response.errors,
      extensions: response.extensions,
    };
  }

  // ── Cache Management ────────────────────────────────────────────────────

  /**
   * Invalidate all cached responses (quotes, enrich, priceHistory) that
   * contain any of the given tickers. Call this after external events that
   * make cached data stale — e.g. after signal ingestion for watchlist tickers.
   * No-op if the client was constructed without `cache`.
   */
  invalidateCache(tickers: string[]): void {
    this.responseCache?.invalidateTickers(tickers);
  }

  // ── Convenience Methods ─────────────────────────────────────────────────

  async searchEntities(
    query: string,
    options?: { type?: EntityType; limit?: number },
  ): Promise<JintelResult<Entity[]>> {
    try {
      const variables: Record<string, unknown> = { query };
      if (options?.type) variables.type = options.type;
      if (options?.limit != null) variables.limit = options.limit;

      const data = await this.request<Entity[]>(SEARCH_ENTITIES, variables, {
        key: 'searchEntities',
      });
      return { success: true, data: data ?? [] };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async enrichEntity(
    ticker: string,
    fields?: EnrichmentField[],
    options?: EnrichOptions,
  ): Promise<JintelResult<Entity>> {
    try {
      const selectedFields = fields ?? ALL_ENRICHMENT_FIELDS;
      const query = buildEnrichQuery(selectedFields, options);
      const variables: Record<string, unknown> = { id: ticker, ...enrichFilterVariables(options) };
      const data = await this.request<Entity>(query, variables, { key: 'entity' });
      if (!data) {
        return { success: false, error: `Entity not found: ${ticker}` };
      }
      return { success: true, data };
    } catch (err) {
      return this.handleError(err);
    }
  }

  /**
   * Batch enrich multiple tickers in a single GraphQL call. Mercurius loaders
   * on the server side batch and deduplicate upstream API calls automatically.
   *
   * @param options - Optional pagination/filter options. Pass `{ topHolders: { limit, offset } }` to paginate top holders.
   */
  async batchEnrich(
    tickers: string[],
    fields?: EnrichmentField[],
    options?: EnrichOptions,
  ): Promise<JintelResult<Entity[]>> {
    if (tickers.length === 0) {
      return { success: true, data: [] };
    }
    if (tickers.length > 20) {
      return {
        success: false,
        error: `batchEnrich accepts at most 20 tickers; received ${tickers.length}`,
      };
    }
    try {
      const selectedFields = fields ?? ALL_ENRICHMENT_FIELDS;
      const query = buildBatchEnrichQuery(selectedFields, options);
      const variables: Record<string, unknown> = { tickers, ...enrichFilterVariables(options) };

      if (this.responseCache) {
        const key = this.responseCache.enrichKey(tickers, selectedFields);
        const cached = this.responseCache.get<Entity[]>(key);
        if (cached) return { success: true, data: cached };
        const data = await this.request<Entity[]>(query, variables, { key: 'entitiesByTickers' });
        const result = data ?? [];
        this.responseCache.set(key, result, this.responseCache.enrichTtlMs);
        return { success: true, data: result };
      }
      const data = await this.request<Entity[]>(query, variables, { key: 'entitiesByTickers' });
      return { success: true, data: data ?? [] };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async quotes(tickers: string[]): Promise<JintelResult<MarketQuote[]>> {
    try {
      if (this.responseCache) {
        const key = this.responseCache.quoteKey(tickers);
        const cached = this.responseCache.get<MarketQuote[]>(key);
        if (cached) return { success: true, data: cached };
        const data = await this.request<MarketQuote[]>(QUOTES, { tickers }, { key: 'quotes' });
        const result = data ?? [];
        this.responseCache.set(key, result, this.responseCache.quotesTtlMs);
        return { success: true, data: result };
      }
      const data = await this.request<MarketQuote[]>(QUOTES, { tickers }, { key: 'quotes' });
      return { success: true, data: data ?? [] };
    } catch (err) {
      return this.handleError(err);
    }
  }

  /**
   * OFAC sanctions screening. Accepts `SanctionsFilterInput` to narrow by score,
   * list name, or sanctions program.
   */
  async sanctionsScreen(
    name: string,
    country?: string,
    filter?: SanctionsFilterOptions,
  ): Promise<JintelResult<SanctionsMatch[]>> {
    try {
      const variables: Record<string, unknown> = { name };
      if (country) variables.country = country;
      if (filter) variables.filter = filter;

      const data = await this.request<SanctionsMatch[]>(SANCTIONS_SCREEN, variables, { key: 'sanctionsScreen' });
      return { success: true, data: data ?? [] };
    } catch (err) {
      return this.handleError(err);
    }
  }

  /**
   * Batch price history — OHLCV candles for multiple tickers.
   * @param range - "1y", "6m", "3m", "1m", "5d" etc. Defaults to "1y".
   * @param interval - Candle interval: "1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1W", "1M", "1Q". Defaults to "1d".
   */
  async priceHistory(
    tickers: string[],
    range?: string,
    interval?: string,
  ): Promise<JintelResult<TickerPriceHistory[]>> {
    if (tickers.length === 0) {
      return { success: true, data: [] };
    }
    if (tickers.length > 20) {
      return {
        success: false,
        error: `priceHistory accepts at most 20 tickers; received ${tickers.length}`,
      };
    }
    try {
      const variables: Record<string, unknown> = { tickers };
      if (range) variables.range = range;
      if (interval) variables.interval = interval;

      if (this.responseCache) {
        const key = this.responseCache.priceHistoryKey(tickers, range, interval);
        const cached = this.responseCache.get<TickerPriceHistory[]>(key);
        if (cached) return { success: true, data: cached };
        const data = await this.request<TickerPriceHistory[]>(PRICE_HISTORY, variables, { key: 'priceHistory' });
        const result = data ?? [];
        this.responseCache.set(key, result, this.responseCache.priceHistoryTtlMs);
        return { success: true, data: result };
      }
      const data = await this.request<TickerPriceHistory[]>(PRICE_HISTORY, variables, { key: 'priceHistory' });
      return { success: true, data: data ?? [] };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async shortInterest(
    ticker: string,
    filter?: ArraySubGraphOptions,
  ): Promise<JintelResult<ShortInterestReport[]>> {
    try {
      const variables: Record<string, unknown> = { ticker };
      if (filter) variables.filter = filter;
      const data = await this.request<ShortInterestReport[]>(SHORT_INTEREST, variables, { key: 'shortInterest' });
      return { success: true, data: data ?? [] };
    } catch (err) {
      return this.handleError(err);
    }
  }

  /**
   * Campaign finance / PAC data via OpenFEC. Accepts `CampaignFinanceFilterInput`
   * to narrow by party, state, committee type, or minimum raised.
   */
  async campaignFinance(
    name: string,
    cycle?: number,
    filter?: CampaignFinanceFilterOptions,
  ): Promise<JintelResult<PACCommittee[]>> {
    try {
      const variables: Record<string, unknown> = { name };
      if (cycle != null) variables.cycle = cycle;
      if (filter) variables.filter = filter;
      const data = await this.request<PACCommittee[]>(CAMPAIGN_FINANCE, variables, { key: 'campaignFinance' });
      return { success: true, data: data ?? [] };
    } catch (err) {
      return this.handleError(err);
    }
  }

  /**
   * Institutional 13F holdings for a filer by CIK.
   * Returns the latest 13F-HR filing's portfolio.
   * Accepts InstitutionalHoldingsFilterInput for minValue/cusip/offset/date/limit/sort.
   */
  async institutionalHoldings(
    cik: string,
    filter?: InstitutionalHoldingsFilterOptions,
  ): Promise<JintelResult<InstitutionalHolding[]>> {
    try {
      const variables: Record<string, unknown> = { cik };
      if (filter) variables.filter = filter;
      const data = await this.request<InstitutionalHolding[]>(INSTITUTIONAL_HOLDINGS, variables, {
        key: 'institutionalHoldings',
      });
      return { success: true, data: data ?? [] };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async famaFrenchFactors(
    series: FamaFrenchSeries,
    range?: string,
    filter?: ArraySubGraphOptions,
  ): Promise<JintelResult<FactorDataPoint[]>> {
    try {
      const variables: Record<string, unknown> = { series };
      if (range) variables.range = range;
      if (filter) variables.filter = filter;
      const data = await this.request<FactorDataPoint[]>(FAMA_FRENCH_FACTORS, variables, {
        key: 'famaFrenchFactors',
      });
      return { success: true, data: data ?? [] };
    } catch (err) {
      return this.handleError(err);
    }
  }

  /**
   * GDP data by country via OECD. Pass `type` to select REAL, NOMINAL, or FORECAST.
   * Optional `filter` slices by date range and limit (ArrayFilterInput).
   */
  async gdp(
    country: string,
    type?: GdpType,
    filter?: ArraySubGraphOptions,
  ): Promise<JintelResult<EconomicDataPoint[]>> {
    try {
      const variables: Record<string, unknown> = { country };
      if (type) variables.type = type;
      if (filter) variables.filter = filter;
      const data = await this.request<EconomicDataPoint[]>(GDP, variables, { key: 'gdp' });
      return { success: true, data: data ?? [] };
    } catch (err) {
      return this.handleError(err);
    }
  }

  /**
   * CPI / inflation data by country via OECD. Optional `filter` (ArrayFilterInput).
   */
  async inflation(country: string, filter?: ArraySubGraphOptions): Promise<JintelResult<EconomicDataPoint[]>> {
    try {
      const variables: Record<string, unknown> = { country };
      if (filter) variables.filter = filter;
      const data = await this.request<EconomicDataPoint[]>(INFLATION, variables, { key: 'inflation' });
      return { success: true, data: data ?? [] };
    } catch (err) {
      return this.handleError(err);
    }
  }

  /**
   * Policy interest rates by country via OECD. Optional `filter` (ArrayFilterInput).
   */
  async interestRates(country: string, filter?: ArraySubGraphOptions): Promise<JintelResult<EconomicDataPoint[]>> {
    try {
      const variables: Record<string, unknown> = { country };
      if (filter) variables.filter = filter;
      const data = await this.request<EconomicDataPoint[]>(INTEREST_RATES, variables, { key: 'interestRates' });
      return { success: true, data: data ?? [] };
    } catch (err) {
      return this.handleError(err);
    }
  }

  /**
   * S&P 500 valuation multiples via Multpl (PE, CAPE, dividend yield, etc).
   * Optional `filter` (ArrayFilterInput) to slice the historical series.
   */
  async sp500Multiples(series: SP500Series, filter?: ArraySubGraphOptions): Promise<JintelResult<SP500DataPoint[]>> {
    try {
      const variables: Record<string, unknown> = { series };
      if (filter) variables.filter = filter;
      const data = await this.request<SP500DataPoint[]>(SP500_MULTIPLES, variables, { key: 'sp500Multiples' });
      return { success: true, data: data ?? [] };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async marketStatus(): Promise<JintelResult<USMarketStatus>> {
    try {
      const data = await this.request<USMarketStatus>(MARKET_STATUS, undefined, { key: 'marketStatus' });
      return { success: true, data };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    latencyMs: number;
    error?: string;
  }> {
    const start = Date.now();
    try {
      await this.execute('{ __typename }');
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { healthy: false, latencyMs: Date.now() - start, error: msg };
    }
  }
}
