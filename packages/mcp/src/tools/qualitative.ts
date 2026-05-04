import type { JintelClient } from '@yojinhq/jintel-client';
import type {
  DiscussionsFilterOptions,
  PredictionMarketFilterOptions,
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
  asString,
  buildArrayFilter,
  errorMessage,
  fail,
  fetchSubGraph,
  runTool,
} from './shared.js';

export function buildQualitativeTools(client: JintelClient): ToolDefinition[] {
  return [
    {
      name: 'jintel_research',
      bundle: 'qualitative' as const,
      description:
        'Long-form research content for an entity — analyst notes, sell-side reports, in-depth web articles. Returns `{ id, tickers, data: ResearchResult[] }` newest first. Use this when you want considered analysis rather than headline news (for which use `jintel_news`).',
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
              'research',
              filter ? { filter } : undefined,
            ),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_sentiment',
      bundle: 'qualitative' as const,
      description:
        'Aggregated social-sentiment SUMMARY for an entity — total Reddit / Twitter mention counts, upvotes, 24h momentum delta. Scalar snapshot (no date filter). Returns `{ id, tickers, data: SocialSentiment }` with overall scores. For the raw underlying posts and comments, use `jintel_social`.',
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
            fetchSubGraph(client, ticker, 'sentiment', undefined),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_social',
      bundle: 'qualitative' as const,
      description:
        'Raw social-media signal feed for an entity — recent Reddit posts, Reddit comments, Twitter mentions, with content text. Returns `{ id, tickers, data: Social }`. Use for qualitative retail-sentiment color. For an aggregated sentiment SCORE rather than raw posts, use `jintel_sentiment`.',
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
            fetchSubGraph(client, ticker, 'social', undefined),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_discussions',
      bundle: 'qualitative' as const,
      description:
        'Hacker News stories that mention an entity. Returns `{ id, tickers, data: HackerNewsStory[] }` newest first. Filter by minimum `points` / `comments` to skip low-engagement noise. Niche but high-signal for tech companies and crypto.',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          minPoints: {
            type: 'number',
            description: 'Only include stories with points >= this value.',
          },
          minComments: {
            type: 'number',
            description: 'Only include stories with comments >= this value.',
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
          const minPoints = asOptionalNumber(args.minPoints, 'minPoints');
          const minComments = asOptionalNumber(args.minComments, 'minComments');
          const offset = asOptionalNumber(args.offset, 'offset');
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
            fetchSubGraph(client, ticker, 'discussions', { discussionsFilter }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_predictions',
      bundle: 'qualitative' as const,
      description:
        'Polymarket / Kalshi prediction-market events that reference an entity — earnings beats, CEO succession, M&A, regulatory outcomes. Returns `{ id, tickers, data: PredictionMarket[] }`. Filter `minVolume24hr` or `onlyOpen=true` to skip illiquid / resolved markets.',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          minVolume24hr: {
            type: 'number',
            description: 'Only include events with 24h volume >= this amount.',
          },
          minLiquidity: {
            type: 'number',
            description: 'Only include events with liquidity >= this amount.',
          },
          onlyOpen: {
            type: 'boolean',
            description:
              'Only include events that still have unresolved outcomes.',
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
          const minVolume24hr = asOptionalNumber(
            args.minVolume24hr,
            'minVolume24hr',
          );
          const minLiquidity = asOptionalNumber(
            args.minLiquidity,
            'minLiquidity',
          );
          const onlyOpen = asOptionalBoolean(args.onlyOpen, 'onlyOpen');
          const offset = asOptionalNumber(args.offset, 'offset');
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
            fetchSubGraph(client, ticker, 'predictions', { predictionsFilter }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },
  ];
}
