import type { JintelClient } from '@yojinhq/jintel-client';
import type {
  AcquisitionDirection,
  InsiderTradeFilterOptions,
  TopHoldersFilterOptions,
} from '@yojinhq/jintel-client';
import type { ToolDefinition } from './types.js';
import {
  ASC_DESC,
  LIMIT_SCHEMA,
  OFFSET_SCHEMA,
  SINCE_SCHEMA,
  SORT_SCHEMA,
  TICKER_SCHEMA,
  UNTIL_SCHEMA,
  asOptionalBoolean,
  asOptionalEnum,
  asOptionalNumber,
  asOptionalString,
  asOptionalStringArray,
  asString,
  errorMessage,
  fail,
  fetchSubGraph,
  projectFields,
  runTool,
} from './shared.js';
import { validateFields } from './fields.js';

const VALID_INSTITUTIONAL_HOLDINGS_FIELDS = new Set<string>([
  'issuerName',
  'cusip',
  'titleOfClass',
  'value',
  'shares',
  'sharesOrPrincipal',
  'investmentDiscretion',
  'reportDate',
  'filingDate',
]);

const VALID_INSIDER_TRADES_FIELDS = new Set<string>([
  'accessionNumber',
  'filingUrl',
  'reporterName',
  'reporterCik',
  'officerTitle',
  'isOfficer',
  'isDirector',
  'isTenPercentOwner',
  'isUnder10b5One',
  'securityTitle',
  'transactionDate',
  'transactionCode',
  'acquiredDisposed',
  'shares',
  'pricePerShare',
  'transactionValue',
  'sharesOwnedFollowingTransaction',
  'ownershipType',
  'isDerivative',
  'filingDate',
]);

const ACQUISITION_DIRECTIONS: readonly AcquisitionDirection[] = [
  'ACQUIRED',
  'DISPOSED',
];

export function buildOwnershipTools(client: JintelClient): ToolDefinition[] {
  return [
    {
      name: 'jintel_institutional_holdings',
      bundle: 'ownership' as const,
      description:
        'Fetch a 13F filer\'s institutional holdings by CIK — i.e. "what does this fund/firm own." Use for fund-tracking, whale-watching, position-sizing analysis. Input is the FILER\'s CIK (e.g. `0001067983` for Berkshire), not a ticker. Returns positions from the latest 13F-HR filing. For "who owns THIS company" reverse the perspective and use `jintel_top_holders`.\n\nCommon fields for the optional `fields` arg (omit for all):\n  position: issuerName, cusip, titleOfClass, value, shares, sharesOrPrincipal\n  metadata: investmentDiscretion, reportDate, filingDate',
      inputSchema: {
        type: 'object',
        properties: {
          cik: {
            type: 'string',
            description:
              'Central Index Key of the 13F filer (e.g., "0001067983" for Berkshire)',
          },
          since: {
            type: 'string',
            description:
              'ISO 8601 date — only return filings on or after this date',
          },
          until: {
            type: 'string',
            description:
              'ISO 8601 date — only return filings on or before this date',
          },
          limit: {
            type: 'number',
            description: 'Cap holdings returned (default 20)',
          },
          offset: {
            type: 'number',
            description: 'Skip N rows for pagination (default 0)',
          },
          minValue: {
            type: 'number',
            description:
              'Only include holdings with value >= N (thousands of USD)',
          },
          cusip: {
            type: 'string',
            description: 'Only include holdings matching this CUSIP',
          },
          sort: {
            type: 'string',
            enum: ['ASC', 'DESC'],
            description: 'Sort direction by reportDate (default DESC)',
          },
          fields: {
            type: 'array',
            items: { type: 'string' },
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
          const offset = asOptionalNumber(args.offset, 'offset');
          const minValue = asOptionalNumber(args.minValue, 'minValue');
          const cusip = asOptionalString(args.cusip, 'cusip');
          const sortRaw = asOptionalString(args.sort, 'sort');
          const sort: 'ASC' | 'DESC' | undefined =
            sortRaw === 'ASC' || sortRaw === 'DESC' ? sortRaw : undefined;
          const fields = asOptionalStringArray(args.fields, 'fields');
          const fieldsResult = validateFields(fields, VALID_INSTITUTIONAL_HOLDINGS_FIELDS);
          if (!fieldsResult.ok) return fail(fieldsResult.error);
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
          return runTool(async () => {
            const result = await client.institutionalHoldings(cik, filter);
            if (!result.success) return result;
            return {
              success: true as const,
              data: projectFields(result.data as Record<string, unknown>[], fieldsResult.fields),
            };
          });
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_top_holders',
      bundle: 'ownership' as const,
      description:
        'Top institutional HOLDERS of an entity, ranked by shares held. Returns `{ id, tickers, data: TopHolder[] }`. Use to answer "who owns this company." For "what does this fund own" reverse the perspective and use `jintel_institutional_holdings` with the fund\'s CIK. For aggregate ownership %, use `jintel_ownership`.',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          minValue: {
            type: 'number',
            description:
              'Only include holders with position value >= this amount (USD).',
          },
          offset: OFFSET_SCHEMA,
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
          const minValue = asOptionalNumber(args.minValue, 'minValue');
          const offset = asOptionalNumber(args.offset, 'offset');
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
            fetchSubGraph(client, ticker, 'topHolders', { topHoldersFilter }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_ownership',
      bundle: 'ownership' as const,
      description:
        'Ownership BREAKDOWN for an entity — institutional %, insider %, retail %, float, shares outstanding. Scalar snapshot. Returns `{ id, tickers, data: OwnershipBreakdown }`. For the actual list of top holders use `jintel_top_holders`. For raw 13F filings by a specific fund/CIK use `jintel_institutional_holdings`.',
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
            fetchSubGraph(client, ticker, 'ownership', undefined),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_insider_trades',
      bundle: 'ownership' as const,
      description:
        'Insider Form 4 transactions for an entity — purchases, sales, option exercises by officers, directors, 10% owners. Returns `{ id, tickers, data: InsiderTrade[] }` newest first. Filter by role (`isOfficer` / `isDirector`), 10b5-1 plan status, transaction code, or `minValue`. Use `acquiredDisposed: \'ACQUIRED\'` to focus on insider buying signals (typically more meaningful than selling).\n\nCommon fields for the optional `fields` arg (omit for all):\n  who:         reporterName, reporterCik, officerTitle, isOfficer, isDirector, isTenPercentOwner\n  transaction: transactionDate, transactionCode, acquiredDisposed, shares, pricePerShare, transactionValue\n  other:       securityTitle, sharesOwnedFollowingTransaction, ownershipType, isDerivative, isUnder10b5One, filingDate',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          isOfficer: {
            type: 'boolean',
            description: 'Only include transactions by officers.',
          },
          isDirector: {
            type: 'boolean',
            description: 'Only include transactions by directors.',
          },
          isTenPercentOwner: {
            type: 'boolean',
            description: 'Only include transactions by 10% owners.',
          },
          onlyUnder10b5One: {
            type: 'boolean',
            description:
              'Only include transactions made under a Rule 10b5-1 trading plan.',
          },
          transactionCodes: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Restrict to one or more Form 4 transaction codes (P, S, A, F, M, G, J, D).',
          },
          acquiredDisposed: {
            type: 'string',
            enum: ACQUISITION_DIRECTIONS,
            description:
              'Restrict to acquisitions (ACQUIRED) or disposals (DISPOSED).',
          },
          minValue: {
            type: 'number',
            description:
              'Only include transactions with transactionValue >= this amount (USD).',
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
          const isOfficer = asOptionalBoolean(args.isOfficer, 'isOfficer');
          const isDirector = asOptionalBoolean(args.isDirector, 'isDirector');
          const isTenPercentOwner = asOptionalBoolean(
            args.isTenPercentOwner,
            'isTenPercentOwner',
          );
          const onlyUnder10b5One = asOptionalBoolean(
            args.onlyUnder10b5One,
            'onlyUnder10b5One',
          );
          const transactionCodes = asOptionalStringArray(
            args.transactionCodes,
            'transactionCodes',
          );
          const acquiredDisposed = asOptionalEnum(
            args.acquiredDisposed,
            'acquiredDisposed',
            ACQUISITION_DIRECTIONS,
          );
          const minValue = asOptionalNumber(args.minValue, 'minValue');
          const fields = asOptionalStringArray(args.fields, 'fields');
          const fieldsResult = validateFields(fields, VALID_INSIDER_TRADES_FIELDS);
          if (!fieldsResult.ok) return fail(fieldsResult.error);
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
          return runTool(async () => {
            const result = await fetchSubGraph(client, ticker, 'insiderTrades', {
              insiderTradesFilter,
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
  ];
}
