import type { JintelClient } from '@yojinhq/jintel-client';
import type {
  FuturesCurveFilterOptions,
  OptionsChainFilterOptions,
  OptionsChainSort,
  OptionType,
  SP500Series,
} from '@yojinhq/jintel-client';
import type { ToolDefinition } from './types.js';
import {
  ASC_DESC,
  FAMA_FRENCH_SERIES,
  LIMIT_SCHEMA,
  SINCE_SCHEMA,
  SORT_SCHEMA,
  TICKER_SCHEMA,
  UNTIL_SCHEMA,
  asFamaFrenchSeries,
  asEnum,
  asOptionalEnum,
  asOptionalNumber,
  asOptionalString,
  asStringArray,
  asString,
  buildArrayFilter,
  errorMessage,
  fail,
  fetchSubGraph,
  runTool,
} from './shared.js';

const OPTION_TYPES: readonly OptionType[] = ['CALL', 'PUT'];
const OPTIONS_CHAIN_SORTS: readonly OptionsChainSort[] = [
  'EXPIRATION_ASC',
  'EXPIRATION_DESC',
  'STRIKE_ASC',
  'STRIKE_DESC',
  'VOLUME_DESC',
  'OPEN_INTEREST_DESC',
];
const SP500_SERIES: readonly SP500Series[] = [
  'PE_MONTH',
  'SHILLER_PE_MONTH',
  'DIVIDEND_YIELD_MONTH',
  'EARNINGS_YIELD_MONTH',
];

export function buildMarketsTools(client: JintelClient): ToolDefinition[] {
  return [
    {
      name: 'jintel_price_history',
      bundle: 'markets' as const,
      description:
        'Fetch OHLCV candle history for up to 20 tickers — backtesting, technical analysis, charting, volatility studies. Returns one `TickerPriceHistory` per ticker with an array of `{ date, open, high, low, close, volume }` candles. Default range `1y`, interval `1d`. For a real-time current price use `jintel_quote`; for technical indicators derived from history use `jintel_technicals`.',
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
      name: 'jintel_technicals',
      bundle: 'markets' as const,
      description:
        'Technical indicators snapshot for a ticker — RSI, MACD, Bollinger Bands (+ width), EMA (10/50/200), SMA (20/50/200), 52-WMA, ATR, VWMA, VWAP, MFI, ADX, Stochastic, OBV, Parabolic SAR, Williams %R, plus crossover flags. Returns `{ id, tickers, data: TechnicalIndicators }`. Quick interpretation: RSI > 70 overbought / < 30 oversold; MACD histogram > 0 bullish; price > SMA(200) long-term uptrend; ADX > 25 strong trend; ATR rising = increasing volatility. For raw price candles use `jintel_price_history`.',
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
            fetchSubGraph(client, ticker, 'technicals', undefined),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_derivatives',
      bundle: 'markets' as const,
      description:
        'Derivatives surface for an entity — futures curve and options chain. Best for crypto and major equities. Returns `{ id, tickers, data: DerivativesData }`. **Always narrow the options chain** with `optionType`, `strikeMin`/`strikeMax`, `minVolume`, or `minOpenInterest` — full chains exceed 5,000 rows and consume significant tokens. Filter `futuresFilter` parameters narrow the futures curve independently.',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: TICKER_SCHEMA,
          // Futures
          futuresSince: {
            type: 'string',
            description:
              'Only futures expirations on/after this ISO 8601 date.',
          },
          futuresUntil: {
            type: 'string',
            description:
              'Only futures expirations on/before this ISO 8601 date.',
          },
          futuresLimit: {
            type: 'number',
            description: 'Cap futures result count (default 50).',
          },
          futuresSort: {
            type: 'string',
            enum: ASC_DESC,
            description:
              'Sort direction by expiration (default ASC — nearest first).',
          },
          // Options
          optionsSince: {
            type: 'string',
            description: 'Only option expirations on/after this ISO 8601 date.',
          },
          optionsUntil: {
            type: 'string',
            description:
              'Only option expirations on/before this ISO 8601 date.',
          },
          strikeMin: {
            type: 'number',
            description: 'Minimum strike (inclusive).',
          },
          strikeMax: {
            type: 'number',
            description: 'Maximum strike (inclusive).',
          },
          optionType: {
            type: 'string',
            enum: OPTION_TYPES,
            description: 'Restrict to CALL or PUT.',
          },
          minVolume: {
            type: 'number',
            description: 'Drop contracts with volume below this threshold.',
          },
          minOpenInterest: {
            type: 'number',
            description:
              'Drop contracts with open interest below this threshold.',
          },
          optionsLimit: {
            type: 'number',
            description: 'Cap options result count (default 100).',
          },
          optionsSort: {
            type: 'string',
            enum: OPTIONS_CHAIN_SORTS,
            description: 'Options chain sort order (default EXPIRATION_ASC).',
          },
        },
        required: ['ticker'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, 'ticker');
          const futuresSince = asOptionalString(
            args.futuresSince,
            'futuresSince',
          );
          const futuresUntil = asOptionalString(
            args.futuresUntil,
            'futuresUntil',
          );
          const futuresLimit = asOptionalNumber(
            args.futuresLimit,
            'futuresLimit',
          );
          const futuresSort = asOptionalEnum(
            args.futuresSort,
            'futuresSort',
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
            'optionsSince',
          );
          const optionsUntil = asOptionalString(
            args.optionsUntil,
            'optionsUntil',
          );
          const strikeMin = asOptionalNumber(args.strikeMin, 'strikeMin');
          const strikeMax = asOptionalNumber(args.strikeMax, 'strikeMax');
          const optionType = asOptionalEnum(
            args.optionType,
            'optionType',
            OPTION_TYPES,
          );
          const minVolume = asOptionalNumber(args.minVolume, 'minVolume');
          const minOpenInterest = asOptionalNumber(
            args.minOpenInterest,
            'minOpenInterest',
          );
          const optionsLimit = asOptionalNumber(
            args.optionsLimit,
            'optionsLimit',
          );
          const optionsSort = asOptionalEnum(
            args.optionsSort,
            'optionsSort',
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
            fetchSubGraph(client, ticker, 'derivatives', {
              futuresFilter,
              optionsFilter,
            }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_market_status',
      bundle: 'markets' as const,
      description:
        'Check whether US equity markets are currently open and get the next open/close times. Use to decide whether to trust intraday prices or to schedule queries. Returns `{ isOpen, nextOpen, nextClose, session }`. **US markets only.**',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      handler: async () => {
        return runTool(() => client.marketStatus());
      },
    },

    {
      name: 'jintel_fama_french',
      bundle: 'markets' as const,
      description:
        'Fetch Fama-French factor returns time series — Mkt-RF, SMB, HML, RMW, CMA. Use for factor-based risk attribution, academic finance research, portfolio analysis. THREE_FACTOR = Mkt-RF + SMB + HML; FIVE_FACTOR adds RMW + CMA. Returns array of `{ date, mktRf, smb, hml, rmw?, cma?, rf }`.',
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
      name: 'jintel_short_interest',
      bundle: 'markets' as const,
      description:
        'Fetch bi-monthly short-interest reports for a US equity ticker — share counts, days-to-cover, revision history. Use for crowdedness / squeeze analysis. Returns an array sorted newest first. **US equities only** — non-US tickers return an empty array.',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: {
            type: 'string',
            description: 'US equity ticker (e.g., "GME")',
          },
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
      name: 'jintel_sp500_multiples',
      bundle: 'markets' as const,
      description:
        'S&P 500 valuation multiples time series — `PE_MONTH` (current PE), `SHILLER_PE_MONTH` (CAPE / cyclically-adjusted), `DIVIDEND_YIELD_MONTH`, `EARNINGS_YIELD_MONTH`. Returns array of `{ date, name, value }`. Use for valuation-cycle / regime analysis. For individual-stock multiples, derive from `jintel_financials`.',
      inputSchema: {
        type: 'object',
        properties: {
          series: {
            type: 'string',
            enum: SP500_SERIES,
            description:
              'Multiple series: PE_MONTH, SHILLER_PE_MONTH (CAPE), DIVIDEND_YIELD_MONTH, EARNINGS_YIELD_MONTH.',
          },
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
        },
        required: ['series'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const series = asEnum(args.series, 'series', SP500_SERIES);
          const filter = buildArrayFilter(args);
          return runTool(() => client.sp500Multiples(series, filter));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },
  ];
}
