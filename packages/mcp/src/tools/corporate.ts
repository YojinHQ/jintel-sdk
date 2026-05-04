import type { JintelClient } from '@yojinhq/jintel-client';
import type {
  EarningsFilterOptions,
  ExecutiveSort,
  ExecutivesFilterOptions,
  SegmentDimension,
  SegmentRevenueFilterOptions,
} from '@yojinhq/jintel-client';
import type { ToolDefinition } from './types.js';
import {
  ASC_DESC,
  LIMIT_SCHEMA,
  SINCE_SCHEMA,
  SORT_SCHEMA,
  TICKER_SCHEMA,
  UNTIL_SCHEMA,
  asOptionalEnum,
  asOptionalEnumArray,
  asOptionalNumber,
  asOptionalString,
  asOptionalStringArray,
  asString,
  buildArrayFilter,
  errorMessage,
  fail,
  fetchSubGraph,
  projectFields,
  runTool,
} from './shared.js';
import { validateFields } from './fields.js';

const VALID_SEGMENTED_REVENUE_FIELDS = new Set<string>([
  'accessionNumber',
  'filingUrl',
  'form',
  'filingDate',
  'reportDate',
  'dimension',
  'axis',
  'member',
  'segment',
  'value',
  'startDate',
  'endDate',
  'concept',
]);

const EXECUTIVE_SORTS: readonly ExecutiveSort[] = [
  'PAY_DESC',
  'PAY_ASC',
  'NAME_ASC',
  'NAME_DESC',
];
const SEGMENT_DIMENSIONS: readonly SegmentDimension[] = [
  'PRODUCT',
  'SEGMENT',
  'GEOGRAPHY',
  'CUSTOMER',
];

export function buildCorporateTools(client: JintelClient): ToolDefinition[] {
  return [
    {
      name: 'jintel_executives',
      bundle: 'corporate' as const,
      description:
        'Key executives and named officers for an entity, with annual compensation. Returns `{ id, tickers, data: KeyExecutive[] }`. Sort `PAY_DESC` to surface highest-paid execs; filter by `minPay` for compensation-threshold analysis. Best signal for governance / ESG / pay-ratio research.',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: TICKER_SCHEMA,
          minPay: {
            type: 'number',
            description:
              'Only return executives with annual pay >= this amount (USD). Null pay values excluded when set.',
          },
          limit: LIMIT_SCHEMA,
          sortBy: {
            type: 'string',
            enum: EXECUTIVE_SORTS,
            description: 'Sort order (default PAY_DESC).',
          },
        },
        required: ['ticker'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, 'ticker');
          const minPay = asOptionalNumber(args.minPay, 'minPay');
          const limit = asOptionalNumber(args.limit, 'limit');
          const sortBy = asOptionalEnum(args.sortBy, 'sortBy', EXECUTIVE_SORTS);
          const executivesFilter: ExecutivesFilterOptions | undefined =
            minPay != null || limit != null || sortBy != null
              ? { minPay, limit, sortBy }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, 'executives', { executivesFilter }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_earnings_calendar',
      bundle: 'corporate' as const,
      description:
        'Earnings REPORT history for an entity — past actuals + upcoming dates. Each entry has EPS estimate, EPS actual, revenue estimate, revenue actual, surprise %. Returns `{ id, tickers, data: EarningsReport[] }`. For the prepared press releases (with summaries / links) accompanying these reports, use `jintel_earnings_press_releases`.',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
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
          const earningsFilter: EarningsFilterOptions | undefined =
            since != null || until != null || limit != null || sort != null
              ? { since, until, limit, sort }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, 'earnings', { earningsFilter }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_earnings_press_releases',
      bundle: 'corporate' as const,
      description:
        'Earnings press releases for an entity — formal release text, summaries, links. Returns `{ id, tickers, data: EarningsPressRelease[] }` newest first. Pair with `jintel_earnings_calendar` (which has the structured EPS / revenue numbers) for full earnings context.',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
        },
        required: ['ticker'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, 'ticker');
          const filter = buildArrayFilter(args);
          return runTool(() =>
            fetchSubGraph(
              client,
              ticker,
              'earningsPressReleases',
              filter ? { filter } : undefined,
            ),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_segmented_revenue',
      bundle: 'corporate' as const,
      description:
        'Revenue BROKEN OUT by product, segment, geography, or customer for an entity. Returns `{ id, tickers, data: SegmentRevenue[] }`. Use to understand business mix and concentration. Filter `dimensions` to focus on one breakdown axis. For aggregate top-line revenue use `jintel_financials` instead.\n\nCommon fields for the optional `fields` arg (omit for all):\n  identity:  segment, dimension, member, axis\n  values:    value\n  dates:     filingDate, reportDate, startDate, endDate\n  filing:    accessionNumber, filingUrl, form, concept',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          dimensions: {
            type: 'array',
            items: { type: 'string', enum: SEGMENT_DIMENSIONS },
            description: 'Restrict to one or more breakdown dimensions.',
          },
          minValue: {
            type: 'number',
            description: 'Only include rows with revenue >= this amount (USD).',
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
          const dimensions = asOptionalEnumArray(
            args.dimensions,
            'dimensions',
            SEGMENT_DIMENSIONS,
          );
          const minValue = asOptionalNumber(args.minValue, 'minValue');
          const fields = asOptionalStringArray(args.fields, 'fields');
          const fieldsResult = validateFields(fields, VALID_SEGMENTED_REVENUE_FIELDS);
          if (!fieldsResult.ok) return fail(fieldsResult.error);
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
          return runTool(async () => {
            const result = await fetchSubGraph(client, ticker, 'segmentedRevenue', {
              segmentedRevenueFilter,
            });
            if (!result.success) return result;
            return {
              success: true as const,
              data: {
                ...result.data,
                data: projectFields(result.data.data as Record<string, unknown>[], fieldsResult.fields),
              },
            };
          });
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_analyst_consensus',
      bundle: 'corporate' as const,
      description:
        'Wall Street analyst consensus snapshot for an entity — current recommendation distribution (BUY/HOLD/SELL counts), consensus price target, EPS / revenue estimates, number of analysts. Returns `{ id, tickers, data: AnalystConsensus }`. Scalar — no date filter.',
      inputSchema: {
        type: 'object',
        properties: { ticker: TICKER_SCHEMA },
        required: ['ticker'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, 'ticker');
          return runTool(() =>
            fetchSubGraph(client, ticker, 'analyst', undefined),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },
  ];
}
