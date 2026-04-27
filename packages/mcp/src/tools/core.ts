import type { JintelClient } from '@yojinhq/jintel-client';
import type {
  ArraySubGraphOptions,
  FinancialStatementFilterOptions,
  NewsFilterOptions,
} from '@yojinhq/jintel-client';
import type { ToolDefinition } from './types.js';
import {
  ASC_DESC,
  ENTITY_TYPES,
  LIMIT_SCHEMA,
  SINCE_SCHEMA,
  SORT_SCHEMA,
  TICKER_SCHEMA,
  UNTIL_SCHEMA,
  asEntityType,
  asOptionalEnum,
  asOptionalNumber,
  asOptionalString,
  asOptionalStringArray,
  asString,
  asStringArray,
  errorMessage,
  fail,
  fetchSubGraph,
  projectFields,
  runTool,
} from './shared.js';
import { validateFields } from './fields.js';

const VALID_FINANCIALS_FIELDS = new Set<string>([
  // income statement
  'totalRevenue', 'costOfRevenue', 'grossProfit', 'researchAndDevelopment',
  'sellingGeneralAndAdmin', 'operatingExpense', 'operatingIncome', 'ebit',
  'ebitda', 'interestExpense', 'interestIncome', 'otherIncomeExpense',
  'pretaxIncome', 'taxProvision', 'netIncome', 'basicEps', 'dilutedEps',
  // balance sheet — assets
  'totalAssets', 'currentAssets', 'cashAndEquivalents', 'accountsReceivable',
  'inventory', 'otherCurrentAssets', 'netPPE', 'grossPPE',
  'accumulatedDepreciation', 'goodwill', 'otherIntangibleAssets',
  'longTermInvestments', 'otherNonCurrentAssets', 'netTangibleAssets',
  // balance sheet — liabilities & equity
  'totalLiabilities', 'currentLiabilities', 'accountsPayable', 'currentDebt',
  'otherCurrentLiabilities', 'longTermDebt', 'otherNonCurrentLiabilities',
  'totalDebt', 'netDebt', 'totalEquity', 'commonStockEquity',
  'preferredStockEquity', 'retainedEarnings', 'treasurySharesNumber',
  'treasuryStockValue', 'minorityInterest', 'workingCapital', 'investedCapital',
  // cash flow
  'operatingCashFlow', 'investingCashFlow', 'financingCashFlow', 'freeCashFlow',
  'capitalExpenditure', 'depreciationAmortization', 'changeInWorkingCapital',
  'stockBasedCompensation', 'dividendsPaid', 'repurchaseOfCapitalStock',
  'issuanceOfCapitalStock', 'repaymentOfDebt', 'issuanceOfDebt',
  'netBusinessPurchaseAndSale', 'beginningCashPosition', 'endingCashPosition',
]);

export function buildCoreTools(client: JintelClient): ToolDefinition[] {
  return [
    {
      name: 'jintel_quote',
      bundle: 'core' as const,
      description:
        'Fetch real-time price quotes for one or more tickers — price, change %, volume, day range, market cap. Accepts equities (AAPL, MSFT), crypto (BTC, ETH), and indices (^GSPC). Returns an array of MarketQuote objects, one per ticker. Use this for current snapshots; for historical OHLCV candles use `jintel_price_history`. Always batch multiple tickers in one call rather than calling per-ticker.',
      inputSchema: {
        type: 'object',
        properties: {
          tickers: {
            type: 'array',
            description:
              'Ticker symbols to quote (e.g., ["AAPL", "MSFT", "BTC"])',
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
      bundle: 'core' as const,
      description:
        'Search for entities (companies, people, crypto, commodities, indices) by name, ticker, or keyword. Use this FIRST when you only have a company name — pass the resulting ticker / entity ID into any other tool. Returns up to `limit` matches sorted by confidence, each with `{ id, name, type, tickers, confidence }`.',
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
      name: 'jintel_financials',
      bundle: 'core' as const,
      description:
        'Income statement, balance sheet, and cash flow statement for an entity. Returns `{ id, tickers, data: FinancialStatements }` containing three parallel arrays — `income`, `balanceSheet`, `cashFlow` — sorted newest first. Pass `periodTypes: [\'12M\']` for annual only, `[\'3M\']` for quarterly only. For revenue broken out by segment / geography use `jintel_segmented_revenue`.\n\nCommon fields for the optional `fields` arg (omit for all):\n  income statement: totalRevenue, costOfRevenue, grossProfit, operatingIncome, netIncome, basicEps, dilutedEps\n  balance sheet:    cashAndEquivalents, totalDebt, netPPE, totalEquity, currentAssets, currentLiabilities\n  cash flow:        operatingCashFlow, investingCashFlow, financingCashFlow, capitalExpenditure, freeCashFlow',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          periodTypes: {
            type: 'array',
            items: { type: 'string' },
            description:
              "Restrict to period-type codes as reported upstream (e.g. ['12M'] annual, ['3M'] quarterly).",
          },
          fields: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['ticker'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, 'ticker');
          const since = asOptionalString(args.since, 'since');
          const until = asOptionalString(args.until, 'until');
          const limit = asOptionalNumber(args.limit, 'limit');
          const sort = asOptionalEnum(args.sort, 'sort', ASC_DESC);
          const periodTypes = asOptionalStringArray(
            args.periodTypes,
            'periodTypes',
          );
          const fields = asOptionalStringArray(args.fields, 'fields');
          const fieldsResult = validateFields(fields, VALID_FINANCIALS_FIELDS);
          if (!fieldsResult.ok) return fail(fieldsResult.error);
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
          return runTool<unknown>(async () => {
            const result = await fetchSubGraph(client, ticker, 'financials', {
              financialStatementsFilter,
            });
            if (!result.success) return result;
            const fs = result.data.data;
            if (!fs || !fieldsResult.fields) return result;
            return {
              success: true as const,
              data: {
                ...result.data,
                data: {
                  income: Array.isArray(fs.income) ? projectFields(fs.income as Record<string, unknown>[], fieldsResult.fields) : fs.income,
                  balanceSheet: Array.isArray(fs.balanceSheet) ? projectFields(fs.balanceSheet as Record<string, unknown>[], fieldsResult.fields) : fs.balanceSheet,
                  cashFlow: Array.isArray(fs.cashFlow) ? projectFields(fs.cashFlow as Record<string, unknown>[], fieldsResult.fields) : fs.cashFlow,
                },
              },
            };
          });
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_news',
      bundle: 'core' as const,
      description:
        'Recent news articles MENTIONING an entity — wire stories, press releases, business reporting. Returns `{ id, tickers, data: NewsArticle[] }` newest first; each article has `{ title, url, publishedAt, source, summary, sentimentScore }`. Filter by `sources`, date range, or sentiment range to narrow large feeds. For longer-form analyst notes / deep-dive content use `jintel_research` instead.',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          sources: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Restrict to one or more source names (case-insensitive exact match).',
          },
          minSentiment: {
            type: 'number',
            description:
              'Only include articles with sentimentScore >= this value (-1 to +1).',
          },
          maxSentiment: {
            type: 'number',
            description:
              'Only include articles with sentimentScore <= this value (-1 to +1).',
          },
        },
        required: ['ticker'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, 'ticker');
          const since = asOptionalString(args.since, 'since');
          const until = asOptionalString(args.until, 'until');
          const limit = asOptionalNumber(args.limit, 'limit');
          const sort = asOptionalEnum(args.sort, 'sort', ASC_DESC);
          const sources = asOptionalStringArray(args.sources, 'sources');
          const minSentiment = asOptionalNumber(
            args.minSentiment,
            'minSentiment',
          );
          const maxSentiment = asOptionalNumber(
            args.maxSentiment,
            'maxSentiment',
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
            fetchSubGraph(client, ticker, 'news', { newsFilter }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_query',
      bundle: 'core' as const,
      description:
        "Compact aggregator — a SINGLE tool that fetches any per-entity sub-graph by `kind` (one of 27 names: news / risk / executives / financials / clinical_trials / …). Use when you want to keep your agent's tool list short to save tokens. Returns the same `{ id, tickers, data }` shape as the dedicated tool. **For richer filters** (severities, transaction codes, FDA event types, segment dimensions) use the dedicated `jintel_*` tool — this aggregator only supports `since` / `until` / `limit` / `sort`. Not available via this tool: `gdp`, `inflation`, `interest_rates`, `macro_series`, `campaign_finance`, `short_interest` — use their dedicated tools instead.",
      inputSchema: {
        type: 'object',
        properties: {
          ticker: TICKER_SCHEMA,
          kind: {
            type: 'string',
            enum: [
              'market',
              'fundamentals',
              'news',
              'research',
              'sentiment',
              'social',
              'discussions',
              'predictions',
              'technicals',
              'derivatives',
              'risk',
              'regulatory',
              'periodic_filings',
              'ownership',
              'top_holders',
              'institutional_holdings',
              'insider_trades',
              'financials',
              'executives',
              'earnings_press_releases',
              'segmented_revenue',
              'earnings_calendar',
              'analyst_consensus',
              'clinical_trials',
              'fda_events',
              'litigation',
              'government_contracts',
            ],
            description: 'Which sub-graph to fetch.',
          },
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
        },
        required: ['ticker', 'kind'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, 'ticker');
          const kind = asString(args.kind, 'kind');
          const since = asOptionalString(args.since, 'since');
          const until = asOptionalString(args.until, 'until');
          const limit = asOptionalNumber(args.limit, 'limit');
          const sort = asOptionalEnum(args.sort, 'sort', ASC_DESC);
          const arrayFilter: ArraySubGraphOptions | undefined =
            since != null || until != null || limit != null || sort != null
              ? { since, until, limit, sort }
              : undefined;

          // Route to the appropriate sub-graph. Each branch must be exhaustive —
          // if you add a `kind`, also add a case here.
          switch (kind) {
            case 'market':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'market', undefined),
              );
            case 'fundamentals':
            case 'financials':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'financials', undefined),
              );
            case 'news':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'news', {
                  newsFilter: arrayFilter,
                }),
              );
            case 'research':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'research', {
                  filter: arrayFilter,
                }),
              );
            case 'sentiment':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'sentiment', undefined),
              );
            case 'social':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'social', undefined),
              );
            case 'discussions':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'discussions', {
                  discussionsFilter: arrayFilter,
                }),
              );
            case 'predictions':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'predictions', {
                  predictionsFilter: arrayFilter,
                }),
              );
            case 'technicals':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'technicals', undefined),
              );
            case 'derivatives':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'derivatives', undefined),
              );
            case 'risk':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'risk', {
                  riskSignalFilter: arrayFilter,
                }),
              );
            case 'regulatory':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'regulatory', {
                  filingsFilter: arrayFilter,
                }),
              );
            case 'periodic_filings':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'periodicFilings', {
                  filter: arrayFilter,
                }),
              );
            case 'ownership':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'ownership', undefined),
              );
            case 'top_holders':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'topHolders', {
                  topHoldersFilter: arrayFilter,
                }),
              );
            case 'institutional_holdings':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'institutionalHoldings', {
                  institutionalHoldingsFilter: arrayFilter,
                }),
              );
            case 'insider_trades':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'insiderTrades', {
                  insiderTradesFilter: arrayFilter,
                }),
              );
            case 'executives':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'executives', undefined),
              );
            case 'earnings_press_releases':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'earningsPressReleases', {
                  filter: arrayFilter,
                }),
              );
            case 'segmented_revenue':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'segmentedRevenue', {
                  segmentedRevenueFilter: arrayFilter,
                }),
              );
            case 'earnings_calendar':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'earnings', {
                  earningsFilter: arrayFilter,
                }),
              );
            case 'analyst_consensus':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'analyst', undefined),
              );
            case 'clinical_trials':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'clinicalTrials', {
                  clinicalTrialsFilter: arrayFilter,
                }),
              );
            case 'fda_events':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'fdaEvents', {
                  fdaEventsFilter: arrayFilter,
                }),
              );
            case 'litigation':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'litigation', {
                  litigationFilter: arrayFilter,
                }),
              );
            case 'government_contracts':
              return runTool(() =>
                fetchSubGraph(client, ticker, 'governmentContracts', {
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
