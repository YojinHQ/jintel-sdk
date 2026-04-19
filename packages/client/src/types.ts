import { z } from 'zod';

// ── Enums ──────────────────────────────────────────────────────────────────

export const EntityTypeSchema = z.enum(['COMPANY', 'PERSON', 'CRYPTO', 'COMMODITY', 'INDEX']);
export type EntityType = z.infer<typeof EntityTypeSchema>;

export const SeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type Severity = z.infer<typeof SeveritySchema>;

export const RiskSignalTypeSchema = z.enum(['SANCTIONS', 'LITIGATION', 'REGULATORY_ACTION', 'ADVERSE_MEDIA', 'PEP']);
export type RiskSignalType = z.infer<typeof RiskSignalTypeSchema>;

export const FilingTypeSchema = z.enum(['FILING_10K', 'FILING_10Q', 'FILING_8K', 'ANNUAL_REPORT', 'OTHER']);
export type FilingType = z.infer<typeof FilingTypeSchema>;

export const OptionTypeSchema = z.enum(['CALL', 'PUT']);
export type OptionType = z.infer<typeof OptionTypeSchema>;

export const OptionsChainSortSchema = z.enum([
  'EXPIRATION_ASC',
  'EXPIRATION_DESC',
  'STRIKE_ASC',
  'STRIKE_DESC',
  'VOLUME_DESC',
  'OPEN_INTEREST_DESC',
]);
export type OptionsChainSort = z.infer<typeof OptionsChainSortSchema>;

export const ExecutiveSortSchema = z.enum(['PAY_DESC', 'PAY_ASC', 'NAME_ASC', 'NAME_DESC']);
export type ExecutiveSort = z.infer<typeof ExecutiveSortSchema>;

export const AcquisitionDirectionSchema = z.enum(['ACQUIRED', 'DISPOSED']);
export type AcquisitionDirection = z.infer<typeof AcquisitionDirectionSchema>;

export const SegmentDimensionSchema = z.enum(['PRODUCT', 'SEGMENT', 'GEOGRAPHY']);
export type SegmentDimension = z.infer<typeof SegmentDimensionSchema>;

// ── Data Schemas ───────────────────────────────────────────────────────────

export const MarketQuoteSchema = z.object({
  ticker: z.string(),
  price: z.number(),
  open: z.number().nullable().optional(),
  high: z.number().nullable().optional(),
  low: z.number().nullable().optional(),
  previousClose: z.number().nullable().optional(),
  change: z.number(),
  changePercent: z.number(),
  volume: z.number(),
  marketCap: z.number().nullable().optional(),
  preMarketPrice: z.number().nullable().optional(),
  preMarketChange: z.number().nullable().optional(),
  preMarketChangePercent: z.number().nullable().optional(),
  postMarketPrice: z.number().nullable().optional(),
  postMarketChange: z.number().nullable().optional(),
  postMarketChangePercent: z.number().nullable().optional(),
  timestamp: z.string(),
  source: z.string(),
});
export type MarketQuote = z.infer<typeof MarketQuoteSchema>;

export const EarningsHistoryEntrySchema = z.object({
  /** Quarter end date (YYYY-MM-DD). */
  period: z.string(),
  epsActual: z.number().nullable().optional(),
  epsEstimate: z.number().nullable().optional(),
  epsDifference: z.number().nullable().optional(),
  surprisePercent: z.number().nullable().optional(),
});
export type EarningsHistoryEntry = z.infer<typeof EarningsHistoryEntrySchema>;

export const FundamentalsSchema = z.object({
  marketCap: z.number().nullable().optional(),
  revenue: z.number().nullable().optional(),
  netIncome: z.number().nullable().optional(),
  eps: z.number().nullable().optional(),
  peRatio: z.number().nullable().optional(),
  dividendYield: z.number().nullable().optional(),
  beta: z.number().nullable().optional(),
  fiftyTwoWeekHigh: z.number().nullable().optional(),
  fiftyTwoWeekLow: z.number().nullable().optional(),
  debtToEquity: z.number().nullable().optional(),
  sector: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  exchange: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  employees: z.number().nullable().optional(),
  website: z.string().nullable().optional(),
  /** Next earnings date (YYYY-MM-DD), if available. */
  earningsDate: z.string().nullable().optional(),
  /** Price-to-book ratio. Null for ETFs / non-equity tickers. */
  priceToBook: z.number().nullable().optional(),
  /** Book value per share. Null when upstream lacks it. */
  bookValue: z.number().nullable().optional(),
  /** Last 4 quarters of earnings actuals vs estimates (newest first). */
  earningsHistory: z.array(EarningsHistoryEntrySchema).nullable().optional(),
  // Valuation
  /** Forward price-to-earnings ratio. */
  forwardPE: z.number().nullable().optional(),
  /** PEG ratio (price/earnings-to-growth, 5-year expected). */
  pegRatio: z.number().nullable().optional(),
  /** Enterprise value to EBITDA ratio. */
  evToEbitda: z.number().nullable().optional(),
  /** Enterprise value to revenue ratio (proxy for P/S). */
  priceToSales: z.number().nullable().optional(),
  /** Forward earnings per share. */
  epsForward: z.number().nullable().optional(),
  // Profitability
  /** Gross margin (normalized 0–1). */
  grossMargin: z.number().nullable().optional(),
  /** Operating margin (normalized 0–1). */
  operatingMargin: z.number().nullable().optional(),
  /** Net profit margin (normalized 0–1). */
  netMargin: z.number().nullable().optional(),
  /** Return on equity (normalized 0–1). */
  returnOnEquity: z.number().nullable().optional(),
  /** Return on assets (normalized 0–1). */
  returnOnAssets: z.number().nullable().optional(),
  // Dividends
  /** Ex-dividend date (YYYY-MM-DD). Null if no dividend. */
  exDividendDate: z.string().nullable().optional(),
  /** Payout ratio (normalized 0–1). Null if no dividend. */
  payoutRatio: z.number().nullable().optional(),
  /** Trailing annual dividend per share (USD). Null if no dividend. */
  annualDividendPerShare: z.number().nullable().optional(),
  // Growth
  /** Revenue growth (YoY, normalized 0–1). */
  revenueGrowth: z.number().nullable().optional(),
  /** Earnings growth (YoY, normalized 0–1). */
  earningsGrowth: z.number().nullable().optional(),
  source: z.string(),
});
export type Fundamentals = z.infer<typeof FundamentalsSchema>;

export const AnalystConsensusSchema = z.object({
  /** Analyst high price target (USD). */
  targetHigh: z.number().nullable().optional(),
  /** Analyst low price target (USD). */
  targetLow: z.number().nullable().optional(),
  /** Analyst mean price target (USD). */
  targetMean: z.number().nullable().optional(),
  /** Analyst median price target (USD). */
  targetMedian: z.number().nullable().optional(),
  /** Consensus recommendation (e.g. buy, hold, sell). */
  recommendation: z.string().nullable().optional(),
  /** Mean recommendation score (1 = strong buy, 5 = strong sell). */
  recommendationMean: z.number().nullable().optional(),
  /** Number of analysts providing opinions. */
  numberOfAnalysts: z.number().nullable().optional(),
});
export type AnalystConsensus = z.infer<typeof AnalystConsensusSchema>;

export const PricePointSchema = z.object({
  date: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
});
export type PricePoint = z.infer<typeof PricePointSchema>;

export const PriceEventTypeSchema = z.enum([
  'SIGNIFICANT_MOVE',
  'FIFTY_TWO_WEEK_HIGH',
  'FIFTY_TWO_WEEK_LOW',
  'VOLUME_SPIKE',
  'GAP_UP',
  'GAP_DOWN',
]);
export type PriceEventType = z.infer<typeof PriceEventTypeSchema>;

export const PriceEventSchema = z.object({
  date: z.string(),
  type: PriceEventTypeSchema,
  description: z.string(),
  priceChange: z.number(),
  changePercent: z.number(),
  close: z.number(),
  volume: z.number().nullable().optional(),
});
export type PriceEvent = z.infer<typeof PriceEventSchema>;

export const ShortInterestReportSchema = z.object({
  ticker: z.string(),
  reportDate: z.string(),
  shortInterest: z.number().nullable().optional(),
  change: z.number().nullable().optional(),
  daysToCover: z.number().nullable().optional(),
  source: z.string(),
});
export type ShortInterestReport = z.infer<typeof ShortInterestReportSchema>;

export const MarketDataSchema = z.object({
  quote: MarketQuoteSchema.nullable().optional(),
  fundamentals: FundamentalsSchema.nullable().optional(),
  history: z.array(PricePointSchema).optional(),
  keyEvents: z.array(PriceEventSchema).optional(),
  shortInterest: z.array(ShortInterestReportSchema).optional(),
});
export type MarketData = z.infer<typeof MarketDataSchema>;

export const RiskSignalSchema = z.object({
  type: RiskSignalTypeSchema,
  severity: SeveritySchema,
  description: z.string(),
  source: z.string(),
  date: z.string().nullable().optional(),
});
export type RiskSignal = z.infer<typeof RiskSignalSchema>;

export const RiskProfileSchema = z.object({
  overallScore: z.number(),
  signals: z.array(RiskSignalSchema),
  sanctionsHits: z.number(),
  adverseMediaHits: z.number(),
  regulatoryActions: z.number(),
});
export type RiskProfile = z.infer<typeof RiskProfileSchema>;

export const SanctionsMatchSchema = z.object({
  listName: z.string(),
  matchedName: z.string(),
  score: z.number(),
  details: z.string().nullable().optional(),
  uid: z.string().nullable().optional(),
  sdnType: z.string().nullable().optional(),
  programs: z.array(z.string()).nullable().optional(),
});
export type SanctionsMatch = z.infer<typeof SanctionsMatchSchema>;

export const FilingSchema = z.object({
  type: FilingTypeSchema,
  date: z.string(),
  url: z.string(),
  description: z.string().nullable().optional(),
});
export type Filing = z.infer<typeof FilingSchema>;

export const PACCommitteeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().nullable().optional(),
  party: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  totalRaised: z.number().nullable().optional(),
  totalSpent: z.number().nullable().optional(),
  cycle: z.number().nullable().optional(),
});
export type PACCommittee = z.infer<typeof PACCommitteeSchema>;

export const RegulatoryDataSchema = z.object({
  sanctions: z.array(SanctionsMatchSchema),
  filings: z.array(FilingSchema),
  campaignFinance: z.array(PACCommitteeSchema).optional(),
});
export type RegulatoryData = z.infer<typeof RegulatoryDataSchema>;

// ── Response Wrappers ──────────────────────────────────────────────────────

export const GraphQLErrorSchema = z.object({
  message: z.string(),
  extensions: z
    .object({
      code: z.string(),
    })
    .nullable()
    .optional(),
});
export type GraphQLError = z.infer<typeof GraphQLErrorSchema>;

export const GraphQLResponseSchema = z.object({
  data: z.unknown().nullable(),
  errors: z.array(GraphQLErrorSchema).optional(),
  extensions: z
    .object({
      meta: z
        .object({
          sources: z.array(z.string()).optional(),
          latency_ms: z.number().optional(),
          cost: z.number().optional(),
          cached: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
});
export type GraphQLResponse = z.infer<typeof GraphQLResponseSchema>;

// ── Economics ─────────────────────────────────────────────────────────────

export const GdpTypeSchema = z.enum(['REAL', 'NOMINAL', 'FORECAST']);
export type GdpType = z.infer<typeof GdpTypeSchema>;

export const SP500SeriesSchema = z.enum([
  'PE_MONTH',
  'SHILLER_PE_MONTH',
  'DIVIDEND_YIELD_MONTH',
  'EARNINGS_YIELD_MONTH',
]);
export type SP500Series = z.infer<typeof SP500SeriesSchema>;

export const EconomicDataPointSchema = z.object({
  date: z.string(),
  country: z.string().nullable().optional(),
  value: z.number().nullable().optional(),
});
export type EconomicDataPoint = z.infer<typeof EconomicDataPointSchema>;

export const SP500DataPointSchema = z.object({
  date: z.string(),
  name: z.string(),
  value: z.number(),
});
export type SP500DataPoint = z.infer<typeof SP500DataPointSchema>;

export const FamaFrenchSeriesSchema = z.enum([
  'THREE_FACTOR_DAILY',
  'THREE_FACTOR_MONTHLY',
  'FIVE_FACTOR_DAILY',
  'FIVE_FACTOR_MONTHLY',
]);
export type FamaFrenchSeries = z.infer<typeof FamaFrenchSeriesSchema>;

export const FactorDataPointSchema = z.object({
  date: z.string(),
  mktRf: z.number().nullable().optional(),
  smb: z.number().nullable().optional(),
  hml: z.number().nullable().optional(),
  rmw: z.number().nullable().optional(),
  cma: z.number().nullable().optional(),
  rf: z.number().nullable().optional(),
});
export type FactorDataPoint = z.infer<typeof FactorDataPointSchema>;

// ── Price History ────────────────────────────────────────────────────────

// PricePointSchema already declared above (Data Schemas section)

export const TickerPriceHistorySchema = z.object({
  ticker: z.string(),
  history: z.array(PricePointSchema),
});
export type TickerPriceHistory = z.infer<typeof TickerPriceHistorySchema>;

// ── Derivatives ──────────────────────────────────────────────────────────

export const FuturesCurvePointSchema = z.object({
  date: z.string().nullable().optional(),
  expiration: z.string(),
  price: z.number().nullable().optional(),
});
export type FuturesCurvePoint = z.infer<typeof FuturesCurvePointSchema>;

export const OptionsChainEntrySchema = z.object({
  contractSymbol: z.string(),
  expiration: z.string(),
  strike: z.number(),
  optionType: z.string(),
  openInterest: z.number().nullable().optional(),
  volume: z.number().nullable().optional(),
  lastTradePrice: z.number().nullable().optional(),
  bid: z.number().nullable().optional(),
  ask: z.number().nullable().optional(),
  impliedVolatility: z.number().nullable().optional(),
  delta: z.number().nullable().optional(),
  gamma: z.number().nullable().optional(),
  theta: z.number().nullable().optional(),
  vega: z.number().nullable().optional(),
});
export type OptionsChainEntry = z.infer<typeof OptionsChainEntrySchema>;

// ── Technical Analysis ────────────────────────────────────────────────────

export const MACDResultSchema = z.object({
  macd: z.number(),
  signal: z.number(),
  histogram: z.number(),
});
export type MACDResult = z.infer<typeof MACDResultSchema>;

export const BollingerBandsResultSchema = z.object({
  upper: z.number(),
  middle: z.number(),
  lower: z.number(),
});
export type BollingerBandsResult = z.infer<typeof BollingerBandsResultSchema>;

export const CrossoversSchema = z.object({
  /** SMA(50) > SMA(200) — bullish long-term trend signal. */
  goldenCross: z.boolean(),
  /** SMA(50) < SMA(200) — bearish long-term trend signal. */
  deathCross: z.boolean(),
  /** EMA(50) > EMA(200) — faster-reacting bullish cross. */
  emaCross: z.boolean(),
});
export type Crossovers = z.infer<typeof CrossoversSchema>;

export const StochasticResultSchema = z.object({
  /** %K line — fast stochastic. */
  k: z.number(),
  /** %D line — slow stochastic (signal). */
  d: z.number(),
});
export type StochasticResult = z.infer<typeof StochasticResultSchema>;

export const TechnicalIndicatorsSchema = z.object({
  ticker: z.string(),
  rsi: z.number().nullable().optional(),
  macd: MACDResultSchema.nullable().optional(),
  bollingerBands: BollingerBandsResultSchema.nullable().optional(),
  ema: z.number().nullable().optional(),
  sma: z.number().nullable().optional(),
  atr: z.number().nullable().optional(),
  vwma: z.number().nullable().optional(),
  mfi: z.number().nullable().optional(),
  /** 20-day Simple Moving Average. */
  sma20: z.number().nullable().optional(),
  /** 200-day Simple Moving Average — most-watched long-term trend line. */
  sma200: z.number().nullable().optional(),
  /** 50-day Exponential Moving Average — medium-term momentum. */
  ema50: z.number().nullable().optional(),
  /** 200-day Exponential Moving Average — long-term EMA for cross signals. */
  ema200: z.number().nullable().optional(),
  /** 52-period Weighted Moving Average — smooths out daily noise. */
  wma52: z.number().nullable().optional(),
  /** Crossover flags derived from SMA(50)/SMA(200) and EMA(50)/EMA(200). */
  crossovers: CrossoversSchema.nullable().optional(),
  /** Average Directional Index — trend strength (not direction). >25 = strong trend, <20 = sideways. */
  adx: z.number().nullable().optional(),
  /** Stochastic oscillator — overbought/oversold momentum. */
  stochastic: StochasticResultSchema.nullable().optional(),
  /** On-Balance Volume — volume-confirmed trend direction. */
  obv: z.number().nullable().optional(),
  /** Volume-Weighted Average Price — institutional reference price. */
  vwap: z.number().nullable().optional(),
  /** Parabolic SAR — trailing stop value. Below price = bullish, above = bearish. */
  parabolicSar: z.number().nullable().optional(),
  /** Bollinger Bands Width — (upper - lower) / middle. Low values signal a volatility squeeze. */
  bollingerBandsWidth: z.number().nullable().optional(),
  /** Williams %R — overbought/oversold oscillator (-100 to 0). Below -80 = oversold, above -20 = overbought. */
  williamsR: z.number().nullable().optional(),
});
export type TechnicalIndicators = z.infer<typeof TechnicalIndicatorsSchema>;

export const DerivativesDataSchema = z.object({
  futures: z.array(FuturesCurvePointSchema),
  options: z.array(OptionsChainEntrySchema),
});
export type DerivativesData = z.infer<typeof DerivativesDataSchema>;

// ── News & Research ──────────────────────────────────────────────────────

export const NewsArticleSchema = z.object({
  title: z.string(),
  link: z.string(),
  snippet: z.string(),
  source: z.string(),
  date: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  /** AFINN-based sentiment polarity in [-1, +1], computed locally from title + snippet. */
  sentimentScore: z.number().nullable().optional(),
});
export type NewsArticle = z.infer<typeof NewsArticleSchema>;

export const ResearchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  publishedDate: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  text: z.string(),
  score: z.number(),
});
export type ResearchResult = z.infer<typeof ResearchResultSchema>;

// ── Social Sentiment ─────────────────────────────────────────────────────

export const SocialSentimentSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  rank: z.number(),
  mentions: z.number(),
  upvotes: z.number(),
  rank24hAgo: z.number(),
  mentions24hAgo: z.number(),
});
export type SocialSentiment = z.infer<typeof SocialSentimentSchema>;

// ── Social Media ───────────────────────────────────────────────────────

export const RedditPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  subreddit: z.string(),
  author: z.string(),
  score: z.number(),
  numComments: z.number(),
  url: z.string(),
  text: z.string(),
  date: z.string().nullable().optional(),
  /** True when the post links to an external article rather than being a Reddit self-post. */
  isLinkPost: z.boolean(),
  /** Domain of the linked article (e.g. "ethnews.com"). Null for self-posts. */
  linkDomain: z.string().nullable().optional(),
});
export type RedditPost = z.infer<typeof RedditPostSchema>;

export const RedditCommentSchema = z.object({
  id: z.string(),
  body: z.string(),
  author: z.string(),
  subreddit: z.string(),
  score: z.number(),
  date: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  postId: z.string().nullable().optional(),
});
export type RedditComment = z.infer<typeof RedditCommentSchema>;

export const SocialSchema = z.object({
  reddit: z.array(RedditPostSchema).optional(),
  redditComments: z.array(RedditCommentSchema).optional(),
});
export type Social = z.infer<typeof SocialSchema>;

// ── Financial Statements ────────────────────────────────────────────────

export const FinancialStatementSchema = z.object({
  periodEnding: z.string(),
  periodType: z.string().nullable().optional(),
  totalRevenue: z.number().nullable().optional(),
  costOfRevenue: z.number().nullable().optional(),
  grossProfit: z.number().nullable().optional(),
  researchAndDevelopment: z.number().nullable().optional(),
  sellingGeneralAndAdmin: z.number().nullable().optional(),
  operatingExpense: z.number().nullable().optional(),
  operatingIncome: z.number().nullable().optional(),
  ebit: z.number().nullable().optional(),
  ebitda: z.number().nullable().optional(),
  netIncome: z.number().nullable().optional(),
  basicEps: z.number().nullable().optional(),
  dilutedEps: z.number().nullable().optional(),
  totalAssets: z.number().nullable().optional(),
  totalLiabilities: z.number().nullable().optional(),
  totalEquity: z.number().nullable().optional(),
  cashAndEquivalents: z.number().nullable().optional(),
  totalDebt: z.number().nullable().optional(),
  currentAssets: z.number().nullable().optional(),
  currentLiabilities: z.number().nullable().optional(),
  retainedEarnings: z.number().nullable().optional(),
  operatingCashFlow: z.number().nullable().optional(),
  investingCashFlow: z.number().nullable().optional(),
  financingCashFlow: z.number().nullable().optional(),
  freeCashFlow: z.number().nullable().optional(),
  capitalExpenditure: z.number().nullable().optional(),
  dividendsPaid: z.number().nullable().optional(),
  stockBasedCompensation: z.number().nullable().optional(),
});
export type FinancialStatement = z.infer<typeof FinancialStatementSchema>;

export const FinancialStatementsSchema = z.object({
  income: z.array(FinancialStatementSchema),
  balanceSheet: z.array(FinancialStatementSchema),
  cashFlow: z.array(FinancialStatementSchema),
});
export type FinancialStatements = z.infer<typeof FinancialStatementsSchema>;

// ── Institutional Holdings (13F) ──────────────────────────────────────

export const InstitutionalHoldingSchema = z.object({
  /** Name of the issuer (e.g. APPLE INC). */
  issuerName: z.string(),
  /** CUSIP identifier of the security. */
  cusip: z.string(),
  /** Class of security (e.g. COM, CL A). */
  titleOfClass: z.string(),
  /** Market value in thousands of USD (as reported in the filing). */
  value: z.number(),
  /** Number of shares (or principal amount for debt securities). */
  shares: z.number(),
  /** SH (shares) or PRN (principal amount). */
  sharesOrPrincipal: z.string(),
  /** Investment discretion: SOLE, SHARED, or DEFINED. */
  investmentDiscretion: z.string(),
  /** Quarter-end date of the reporting period (YYYY-MM-DD). */
  reportDate: z.string(),
  /** Date the filing was submitted to the SEC (YYYY-MM-DD). */
  filingDate: z.string(),
});
export type InstitutionalHolding = z.infer<typeof InstitutionalHoldingSchema>;

// ── Ownership Breakdown ───────────────────────────────────────────────

export const OwnershipBreakdownSchema = z.object({
  symbol: z.string(),
  /** Percentage of shares held by insiders (normalized 0–1). */
  insiderOwnership: z.number().nullable().optional(),
  /** Percentage of shares held by institutions (normalized 0–1). */
  institutionOwnership: z.number().nullable().optional(),
  /** Percentage of float held by institutions (normalized 0–1). */
  institutionFloatOwnership: z.number().nullable().optional(),
  /** Number of institutions holding shares. */
  institutionsCount: z.number().nullable().optional(),
  /** Total shares outstanding. */
  outstandingShares: z.number().nullable().optional(),
  /** Number of shares available for public trading. */
  floatShares: z.number().nullable().optional(),
  /** Number of shares reported short. */
  shortInterest: z.number().nullable().optional(),
  /** Short interest as percentage of float (normalized 0–1). */
  shortPercentOfFloat: z.number().nullable().optional(),
  /** Days to cover short interest (ratio of avg daily volume). */
  daysToCover: z.number().nullable().optional(),
  /** Previous month short interest count. */
  shortInterestPrevMonth: z.number().nullable().optional(),
  /** Settlement date of the short-interest snapshot (YYYY-MM-DD). Upstream may leave this stale for many tickers — callers should flag data older than ~45 days. */
  shortInterestDate: z.string().nullable().optional(),
});
export type OwnershipBreakdown = z.infer<typeof OwnershipBreakdownSchema>;

// ── Top Holders (Reverse 13F) ─────────────────────────────────────────

export const TopHolderSchema = z.object({
  /** Filer name (e.g. BERKSHIRE HATHAWAY INC). */
  filerName: z.string(),
  /** SEC CIK of the filer (10-digit padded). */
  cik: z.string(),
  /** Market value in thousands of USD. */
  value: z.number(),
  /** Number of shares held. */
  shares: z.number(),
  /** Quarter-end date of the reporting period (YYYY-MM-DD). */
  reportDate: z.string(),
  /** Date the filing was submitted to the SEC (YYYY-MM-DD). */
  filingDate: z.string(),
});
export type TopHolder = z.infer<typeof TopHolderSchema>;

// ── Key Executives ─────────────────────────────────────────────────────

export const KeyExecutiveSchema = z.object({
  name: z.string(),
  title: z.string(),
  pay: z.number().nullable().optional(),
  yearBorn: z.number().nullable().optional(),
  age: z.number().nullable().optional(),
  exercisedValue: z.number().nullable().optional(),
  unexercisedValue: z.number().nullable().optional(),
});
export type KeyExecutive = z.infer<typeof KeyExecutiveSchema>;

// ── Prediction Markets ──────────────────────────────────────────────────

export const PredictionOutcomeSchema = z.object({
  name: z.string(),
  probability: z.number(),
});
export type PredictionOutcome = z.infer<typeof PredictionOutcomeSchema>;

export const PredictionMarketSchema = z.object({
  eventId: z.string(),
  title: z.string(),
  url: z.string(),
  outcomes: z.array(PredictionOutcomeSchema),
  outcomesRemaining: z.number(),
  priceMovement: z.string().nullable().optional(),
  volume24hr: z.number().nullable().optional(),
  volume1mo: z.number().nullable().optional(),
  liquidity: z.number().nullable().optional(),
  date: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});
export type PredictionMarket = z.infer<typeof PredictionMarketSchema>;

// ── Hacker News ─────────────────────────────────────────────────────────

export const HackerNewsCommentSchema = z.object({
  author: z.string(),
  text: z.string(),
  points: z.number(),
});
export type HackerNewsComment = z.infer<typeof HackerNewsCommentSchema>;

export const HackerNewsStorySchema = z.object({
  objectId: z.string(),
  title: z.string(),
  url: z.string(),
  hnUrl: z.string(),
  author: z.string(),
  date: z.string().nullable().optional(),
  points: z.number(),
  numComments: z.number(),
  topComments: z.array(HackerNewsCommentSchema),
});
export type HackerNewsStory = z.infer<typeof HackerNewsStorySchema>;

// ── Market Status ───────────────────────────────────────────────────────

export const MarketSessionSchema = z.enum(['PRE_MARKET', 'OPEN', 'AFTER_HOURS', 'CLOSED']);
export type MarketSession = z.infer<typeof MarketSessionSchema>;

export const USMarketStatusSchema = z.object({
  isOpen: z.boolean(),
  isTradingDay: z.boolean(),
  session: MarketSessionSchema,
  holiday: z.string().nullable().optional(),
  date: z.string(),
});
export type USMarketStatus = z.infer<typeof USMarketStatusSchema>;

// ── SEC Form 4 Insider Trades ─────────────────────────────────────────────

export const InsiderTradeSchema = z.object({
  accessionNumber: z.string(),
  filingUrl: z.string(),
  reporterName: z.string(),
  reporterCik: z.string(),
  officerTitle: z.string(),
  isOfficer: z.boolean(),
  isDirector: z.boolean(),
  isTenPercentOwner: z.boolean(),
  /** True when the transaction was made under a Rule 10b5-1 trading plan. */
  isUnder10b5One: z.boolean(),
  securityTitle: z.string(),
  transactionDate: z.string(),
  /** Raw Form 4 code (P, S, A, F, M, G, J, D). */
  transactionCode: z.string(),
  /** 'A' (acquired) or 'D' (disposed). */
  acquiredDisposed: z.string(),
  shares: z.number(),
  /** Null for option exercises / grants where price is zero-footnoted. */
  pricePerShare: z.number().nullable().optional(),
  transactionValue: z.number().nullable().optional(),
  sharesOwnedFollowingTransaction: z.number(),
  /** 'D' (direct) or 'I' (indirect). */
  ownershipType: z.string(),
  isDerivative: z.boolean(),
  filingDate: z.string(),
});
export type InsiderTrade = z.infer<typeof InsiderTradeSchema>;

// ── Earnings Reports ─────────────────────────────────────────────────────

export const EarningsReportSchema = z.object({
  /** Fiscal period end date (YYYY-MM-DD). Mirrors reportDate when upstream doesn't expose period separately. */
  period: z.string(),
  /** Announcement / report date (YYYY-MM-DD). */
  reportDate: z.string(),
  /** Fiscal quarter (1-4). */
  quarter: z.number().nullable().optional(),
  /** Fiscal year (e.g. 2024). */
  year: z.number().nullable().optional(),
  /** Reported EPS. Null for not-yet-reported periods. */
  epsActual: z.number().nullable().optional(),
  /** Consensus EPS estimate. */
  epsEstimate: z.number().nullable().optional(),
  /** Reported revenue (USD). Null for not-yet-reported periods. */
  revenueActual: z.number().nullable().optional(),
  /** Consensus revenue estimate (USD). */
  revenueEstimate: z.number().nullable().optional(),
  /** EPS surprise percent ((actual − estimate) / |estimate| × 100). Null when either side missing. */
  surprisePercent: z.number().nullable().optional(),
  /** Revenue surprise percent. Null when either side missing. */
  revenueSurprisePercent: z.number().nullable().optional(),
  /** Release timing: 'bmo' (before market open), 'amc' (after market close), or 'dmh' (during market hours). */
  hour: z.string().nullable().optional(),
});
export type EarningsReport = z.infer<typeof EarningsReportSchema>;

// ── SEC Periodic Filings (10-K / 10-Q section extraction) ───────────────

export const FilingSectionSchema = z.object({
  /** Item identifier. '1A' = Risk Factors, '7' = MD&A, '7A' = Quant & Qual Market Risk (10-K). 'II-1A' = Part II Item 1A update (10-Q). */
  item: z.string(),
  /** Human-readable section title, falling back to a canonical label when the filing's header text is missing. */
  title: z.string(),
  /** Plain-text body of the section. HTML stripped, whitespace normalised. Capped at 50 000 chars. */
  body: z.string(),
  /** First ~300 chars of the body. */
  excerpt: z.string(),
  /** Character count of the body. */
  bodyLength: z.number(),
});
export type FilingSection = z.infer<typeof FilingSectionSchema>;

export const PeriodicFilingSchema = z.object({
  accessionNumber: z.string(),
  /** Form type: 10-K, 10-K/A, 10-Q, or 10-Q/A. */
  form: z.string(),
  filingDate: z.string(),
  reportDate: z.string(),
  filingUrl: z.string(),
  documentUrl: z.string(),
  sections: z.array(FilingSectionSchema),
});
export type PeriodicFiling = z.infer<typeof PeriodicFilingSchema>;

// ── Guidance Snippets (extracted from 8-K press releases) ───────────────

export const GuidanceSnippetSchema = z.object({
  /** The sentence containing the guidance. */
  text: z.string(),
  /** Primary metric: 'revenue', 'eps', 'margin', 'operatingIncome', 'capex', 'freeCashFlow'. Null when unclear. */
  metric: z.string().nullable().optional(),
  /** Period the guidance covers (e.g. 'Q4 2024', 'FY2024', 'H1 2024'). Null when unclear. */
  period: z.string().nullable().optional(),
  /** Direction: 'raise', 'lower', 'maintain', or 'initiate'. Null when unclear. */
  direction: z.string().nullable().optional(),
});
export type GuidanceSnippet = z.infer<typeof GuidanceSnippetSchema>;

// ── SEC 8-K Earnings Press Releases ──────────────────────────────────────

export const EarningsPressReleaseSchema = z.object({
  accessionNumber: z.string(),
  filingDate: z.string(),
  reportDate: z.string(),
  /** Raw 8-K items string, e.g. '2.02,9.01'. */
  items: z.string(),
  filingUrl: z.string(),
  /** Direct URL to the EX-99.1 press release attachment. Null when the filing had none. */
  pressReleaseUrl: z.string().nullable().optional(),
  /** Plain-text body (HTML stripped). Capped at 50 000 chars. */
  body: z.string(),
  /** First ~300 chars of the body. */
  excerpt: z.string(),
  bodyLength: z.number(),
  /** Forward-looking guidance snippets extracted from the body. Best-effort — treat as "likely guidance", not ground truth. */
  guidance: z.array(GuidanceSnippetSchema).optional(),
});
export type EarningsPressRelease = z.infer<typeof EarningsPressReleaseSchema>;

// ── SEC XBRL Segmented Revenue ───────────────────────────────────────────

export const SegmentRevenueSchema = z.object({
  accessionNumber: z.string(),
  filingUrl: z.string(),
  form: z.string(),
  filingDate: z.string(),
  reportDate: z.string(),
  /** 'product', 'segment', or 'geography'. */
  dimension: z.string(),
  axis: z.string(),
  member: z.string(),
  /** Human-readable label derived from the member qname (e.g. 'iPhone'). */
  segment: z.string(),
  value: z.number(),
  /** Null for instant contexts. */
  startDate: z.string().nullable().optional(),
  /** Null for instant contexts. */
  endDate: z.string().nullable().optional(),
  concept: z.string(),
});
export type SegmentRevenue = z.infer<typeof SegmentRevenueSchema>;

// ── Entity (must come after all sub-graph schemas) ────────────────────────

export const EntitySchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  type: EntityTypeSchema,
  tickers: z.array(z.string()).nullable().optional(),
  domain: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  market: MarketDataSchema.nullable().optional(),
  risk: RiskProfileSchema.nullable().optional(),
  regulatory: RegulatoryDataSchema.nullable().optional(),
  technicals: TechnicalIndicatorsSchema.nullable().optional(),
  derivatives: DerivativesDataSchema.nullable().optional(),
  news: z.array(NewsArticleSchema).optional(),
  research: z.array(ResearchResultSchema).optional(),
  sentiment: SocialSentimentSchema.nullable().optional(),
  social: SocialSchema.nullable().optional(),
  predictions: z.array(PredictionMarketSchema).optional(),
  discussions: z.array(HackerNewsStorySchema).optional(),
  analyst: AnalystConsensusSchema.nullable().optional(),
  financials: FinancialStatementsSchema.nullable().optional(),
  executives: z.array(KeyExecutiveSchema).optional(),
  institutionalHoldings: z.array(InstitutionalHoldingSchema).optional(),
  ownership: OwnershipBreakdownSchema.nullable().optional(),
  topHolders: z.array(TopHolderSchema).optional(),
  insiderTrades: z.array(InsiderTradeSchema).optional(),
  earningsPressReleases: z.array(EarningsPressReleaseSchema).optional(),
  segmentedRevenue: z.array(SegmentRevenueSchema).optional(),
  earnings: z.array(EarningsReportSchema).optional(),
  periodicFilings: z.array(PeriodicFilingSchema).optional(),
});
export type Entity = z.infer<typeof EntitySchema>;

// ── Config & Field Selection ───────────────────────────────────────────────

export interface JintelClientCacheConfig {
  /** TTL for quotes() responses in milliseconds. Default: 30_000 (30s). */
  quotesTtlMs?: number;
  /** TTL for batchEnrich() responses in milliseconds. Default: 300_000 (5 min). */
  enrichTtlMs?: number;
  /** TTL for priceHistory() responses in milliseconds. Default: 300_000 (5 min). */
  priceHistoryTtlMs?: number;
}

export interface JintelClientConfig {
  /** API base URL. Defaults to https://api.jintel.ai/api */
  baseUrl?: string;
  apiKey: string;
  timeout?: number;
  debug?: boolean;
  /**
   * Enable in-process response caching.
   * Pass `true` for defaults, or an object to customise per-method TTLs.
   * Eliminates redundant HTTP calls when the same data is requested within a short window
   * (e.g. multiple micro research cycles, ReflectionEngine per-ticker price lookups).
   */
  cache?: boolean | JintelClientCacheConfig;
}

export interface RequestOptions<T = unknown> {
  /** Zod schema for runtime validation of the response data */
  schema?: z.ZodType<T>;
  /** Specific data key to extract from response (defaults to first key) */
  key?: string;
}

export type EnrichmentField =
  | 'market'
  | 'risk'
  | 'regulatory'
  | 'technicals'
  | 'derivatives'
  | 'news'
  | 'research'
  | 'sentiment'
  | 'social'
  | 'predictions'
  | 'discussions'
  | 'analyst'
  | 'financials'
  | 'executives'
  | 'institutionalHoldings'
  | 'ownership'
  | 'topHolders'
  | 'insiderTrades'
  | 'earningsPressReleases'
  | 'segmentedRevenue'
  | 'earnings'
  | 'periodicFilings';

/** Options for array sub-graph filtering (news, research, etc — anything taking ArrayFilterInput). */
export interface ArraySubGraphOptions {
  /** Only return items published on or after this ISO 8601 timestamp (inclusive). */
  since?: string;
  /** Only return items published on or before this ISO 8601 timestamp (inclusive). */
  until?: string;
  /** Cap the result count (default 20). */
  limit?: number;
  /** Sort direction by date. Default DESC (newest first). */
  sort?: 'ASC' | 'DESC';
}

/** Filter for `regulatory.filings` (FilingsFilterInput). */
export interface FilingsFilterOptions extends ArraySubGraphOptions {
  /** Restrict to specific form types (e.g. `['FILING_10K', 'FILING_10Q']`). */
  types?: FilingType[];
}

/** Filter for `risk.signals` (RiskSignalFilterInput). */
export interface RiskSignalFilterOptions extends ArraySubGraphOptions {
  /** Restrict to specific signal types (e.g. `['SANCTIONS', 'LITIGATION']`). */
  types?: RiskSignalType[];
  /** Restrict to specific severities (e.g. `['HIGH', 'CRITICAL']`). */
  severities?: Severity[];
}

/** Filter for `derivatives.futures` (FuturesCurveFilterInput). Default sort is ASC (nearest first). */
export interface FuturesCurveFilterOptions {
  /** Only expirations on/after this ISO 8601 timestamp. */
  since?: string;
  /** Only expirations on/before this ISO 8601 timestamp. */
  until?: string;
  /** Cap the result count (default 50). */
  limit?: number;
  /** Sort direction by expiration. Default ASC (nearest first). */
  sort?: 'ASC' | 'DESC';
}

/** Filter for `derivatives.options` (OptionsChainFilterInput). Default sort is EXPIRATION_ASC. */
export interface OptionsChainFilterOptions {
  /** Only expirations on/after this ISO 8601 timestamp. */
  since?: string;
  /** Only expirations on/before this ISO 8601 timestamp. */
  until?: string;
  /** Minimum strike price (inclusive). */
  strikeMin?: number;
  /** Maximum strike price (inclusive). */
  strikeMax?: number;
  /** Restrict to CALL or PUT. */
  optionType?: OptionType;
  /** Drop contracts with volume below this threshold. */
  minVolume?: number;
  /** Drop contracts with open interest below this threshold. */
  minOpenInterest?: number;
  /** Cap the result count (default 100). */
  limit?: number;
  /** Sort order. Default EXPIRATION_ASC. */
  sort?: OptionsChainSort;
}

/** Filter for `Entity.news` (NewsFilterInput). */
export interface NewsFilterOptions extends ArraySubGraphOptions {
  /** Restrict to one or more source names (case-insensitive exact match, e.g. `['finnhub', 'CNBC']`). */
  sources?: string[];
  /** Only include articles with sentimentScore >= this value (-1 to +1). */
  minSentiment?: number;
  /** Only include articles with sentimentScore <= this value (-1 to +1). */
  maxSentiment?: number;
}

/** Filter for `Entity.executives` (ExecutivesFilterInput). */
export interface ExecutivesFilterOptions {
  /** Only return executives with annual pay >= this amount (USD). Null pay values are excluded when set. */
  minPay?: number;
  /** Cap the result count (default 20). */
  limit?: number;
  /** Sort order (default PAY_DESC). */
  sortBy?: ExecutiveSort;
}

/** Filter for `Entity.insiderTrades` (InsiderTradeFilterInput). */
export interface InsiderTradeFilterOptions extends ArraySubGraphOptions {
  /** Only include transactions by officers. */
  isOfficer?: boolean;
  /** Only include transactions by directors. */
  isDirector?: boolean;
  /** Only include transactions by 10% owners. */
  isTenPercentOwner?: boolean;
  /** Only include transactions made under a Rule 10b5-1 trading plan. */
  onlyUnder10b5One?: boolean;
  /** Restrict to one or more Form 4 transaction codes (P, S, A, F, M, G, J, D). */
  transactionCodes?: string[];
  /** Restrict to acquisitions (A) or disposals (D). */
  acquiredDisposed?: AcquisitionDirection;
  /** Only include transactions with transactionValue >= this amount (USD). */
  minValue?: number;
}

/** Filter for `Entity.earnings` (EarningsFilterInput). */
export interface EarningsFilterOptions extends ArraySubGraphOptions {
  /** Only include periods that have been reported (epsActual is not null). */
  onlyReported?: boolean;
  /** Only include forward-looking periods that have not yet been reported. */
  onlyUpcoming?: boolean;
  /** Only include reported periods with absolute EPS surprise >= this percent. */
  minSurprisePercent?: number;
  /** Restrict to a fiscal year. */
  year?: number;
}

/** Filter for `Entity.segmentedRevenue` (SegmentRevenueFilterInput). */
export interface SegmentRevenueFilterOptions extends ArraySubGraphOptions {
  /** Restrict to one or more breakdown dimensions. */
  dimensions?: SegmentDimension[];
  /** Only include rows with value >= this amount (USD). */
  minValue?: number;
}

/** Filter for `FinancialStatements.income/balanceSheet/cashFlow` (FinancialStatementFilterInput). */
export interface FinancialStatementFilterOptions extends ArraySubGraphOptions {
  /** Restrict to period-type codes as reported upstream (e.g. `['12M']` for annual only, `['3M']` for quarterly only). */
  periodTypes?: string[];
}

/** Filter for OFAC sanctions matches (`RegulatoryData.sanctions` and root `sanctionsScreen`). */
export interface SanctionsFilterOptions {
  /** Only return matches with score >= this value (0-100). */
  minScore?: number;
  /** Restrict to one or more SDN list names (e.g. `['SDN']`). */
  listNames?: string[];
  /** Restrict to matches attached to any of these sanctions programs (e.g. `['SDGT', 'IRAN']`). */
  programs?: string[];
  /** Cap the result count (default 20). */
  limit?: number;
  /** Sort direction by score (default DESC — best match first). */
  sort?: 'ASC' | 'DESC';
}

/** Filter for PAC committees (`RegulatoryData.campaignFinance` and root `campaignFinance`). */
export interface CampaignFinanceFilterOptions {
  /** Election cycle year (e.g. 2024). Omit for all cycles. */
  cycle?: number;
  /** Restrict to a party (e.g. 'REP', 'DEM'). */
  party?: string;
  /** Restrict to a 2-letter US state (e.g. 'CA'). */
  state?: string;
  /** Restrict to an FEC committee type code (e.g. 'Q' for PAC). */
  committeeType?: string;
  /** Only return committees with total raised >= this value (USD). */
  minRaised?: number;
  /** Cap the result count (default 20). */
  limit?: number;
  /** Sort direction by totalRaised (default DESC). */
  sort?: 'ASC' | 'DESC';
}

/** Filter for `Entity.topHolders` (TopHoldersFilterInput). Replaces the old positional `(limit, offset)` args. */
export interface TopHoldersFilterOptions extends ArraySubGraphOptions {
  /** Only include holders with position value >= this amount (thousands of USD). */
  minValue?: number;
  /** Number of holders to skip for pagination (default 0). */
  offset?: number;
}

/** Filter for `Entity.institutionalHoldings` and root `institutionalHoldings` (InstitutionalHoldingsFilterInput). */
export interface InstitutionalHoldingsFilterOptions extends ArraySubGraphOptions {
  /** Only include holdings with value >= this amount (thousands of USD). */
  minValue?: number;
  /** Only include holdings matching this CUSIP. */
  cusip?: string;
  /** Number of rows to skip for pagination (default 0). */
  offset?: number;
}

/** Filter for `Entity.predictions` (PredictionMarketFilterInput). */
export interface PredictionMarketFilterOptions extends ArraySubGraphOptions {
  /** Only include events with 24-hour volume >= this amount. */
  minVolume24hr?: number;
  /** Only include events with liquidity >= this amount. */
  minLiquidity?: number;
  /** Only include events that still have unresolved outcomes. */
  onlyOpen?: boolean;
  /** Number of rows to skip for pagination (default 0). */
  offset?: number;
}

/** Filter for `Entity.discussions` (DiscussionsFilterInput). */
export interface DiscussionsFilterOptions extends ArraySubGraphOptions {
  /** Only include stories with points >= this value. */
  minPoints?: number;
  /** Only include stories with comment count >= this value. */
  minComments?: number;
  /** Number of rows to skip for pagination (default 0). */
  offset?: number;
}

/**
 * Combined options for enrich/batchEnrich.
 *
 * `filter` is the generic `ArrayFilterInput`. It applies only to sub-graphs that still
 * accept ArrayFilterInput: `research`, `social.reddit`, `social.redditComments`,
 * `earningsPressReleases`, `periodicFilings`, `market.history`, `market.keyEvents`,
 * `market.shortInterest`.
 *
 * Domain-specific filters target one sub-graph each and expose extra dimensions
 * (severities, strike ranges, transaction codes, etc). Use the per-field filter
 * for `news`, `executives`, `insiderTrades`, `earnings`, `segmentedRevenue`,
 * `topHolders`, `institutionalHoldings`, `predictions`, `discussions`,
 * `financials.*`, `regulatory.sanctions`, `regulatory.campaignFinance`.
 */
export interface EnrichOptions {
  /** Generic date/limit/sort filter for sub-graphs that still accept ArrayFilterInput. */
  filter?: ArraySubGraphOptions;
  /** Filter for `regulatory.filings`. */
  filingsFilter?: FilingsFilterOptions;
  /** Filter for `risk.signals`. */
  riskSignalFilter?: RiskSignalFilterOptions;
  /** Filter for `derivatives.futures`. */
  futuresFilter?: FuturesCurveFilterOptions;
  /** Filter for `derivatives.options`. Recommended in production — chains can exceed 5 000 rows. */
  optionsFilter?: OptionsChainFilterOptions;
  /** Filter for `Entity.news`. */
  newsFilter?: NewsFilterOptions;
  /** Filter for `Entity.executives`. */
  executivesFilter?: ExecutivesFilterOptions;
  /** Filter for `Entity.insiderTrades`. */
  insiderTradesFilter?: InsiderTradeFilterOptions;
  /** Filter for `Entity.earnings`. */
  earningsFilter?: EarningsFilterOptions;
  /** Filter for `Entity.segmentedRevenue`. */
  segmentedRevenueFilter?: SegmentRevenueFilterOptions;
  /** Filter + pagination for `Entity.topHolders`. */
  topHoldersFilter?: TopHoldersFilterOptions;
  /** Filter + pagination for `Entity.institutionalHoldings`. */
  institutionalHoldingsFilter?: InstitutionalHoldingsFilterOptions;
  /** Filter for `Entity.predictions`. */
  predictionsFilter?: PredictionMarketFilterOptions;
  /** Filter for `Entity.discussions`. */
  discussionsFilter?: DiscussionsFilterOptions;
  /** Filter for `financials.income/balanceSheet/cashFlow`. */
  financialStatementsFilter?: FinancialStatementFilterOptions;
  /** Filter for `regulatory.sanctions`. */
  sanctionsFilter?: SanctionsFilterOptions;
  /** Filter for `regulatory.campaignFinance`. */
  campaignFinanceFilter?: CampaignFinanceFilterOptions;
}

export const ALL_ENRICHMENT_FIELDS: EnrichmentField[] = [
  'market',
  'risk',
  'regulatory',
  'technicals',
  'derivatives',
  'news',
  'research',
  'sentiment',
  'social',
  'predictions',
  'discussions',
  'analyst',
  'financials',
  'executives',
  'institutionalHoldings',
  'ownership',
  'topHolders',
  'insiderTrades',
  'earningsPressReleases',
  'segmentedRevenue',
  'earnings',
  'periodicFilings',
];
