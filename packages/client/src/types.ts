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

export const SegmentDimensionSchema = z.enum(['PRODUCT', 'SEGMENT', 'GEOGRAPHY', 'CUSTOMER']);
export type SegmentDimension = z.infer<typeof SegmentDimensionSchema>;

export const RelationshipTypeSchema = z.enum([
  'CUSTOMER',
  'SUBSIDIARY',
  'GOVERNMENT_CUSTOMER',
  'PARTNER',
  'ADVERSARIAL',
  'OWNERSHIP',
]);
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;

export const RelationshipDirectionSchema = z.enum(['OUT', 'IN']);
export type RelationshipDirection = z.infer<typeof RelationshipDirectionSchema>;

export const RelationshipDisclosureSchema = z.enum(['DIRECT', 'REVERSE', 'THIRD_PARTY']);
export type RelationshipDisclosure = z.infer<typeof RelationshipDisclosureSchema>;

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

export const AsOfFieldPolicySchema = z.object({
  class: z.enum(['SUPPORTED', 'BEST_EFFORT', 'UNSUPPORTED']),
  coverageStart: z.string().optional(),
  warning: z.string().optional(),
});

export const AsOfExtensionSchema = z.object({
  requested: z.string().nullable(),
  fields: z.record(z.string(), AsOfFieldPolicySchema),
});

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
      /**
       * Per-field point-in-time provenance — emitted only when the request
       * was PIT (`asOf` set). See `docs/agent-native-pivot/asof-spec.md` §8.
       */
      asOf: AsOfExtensionSchema.optional(),
    })
    .optional()
    .nullable(),
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

const num = z.number().nullable().optional();

export const FinancialStatementSchema = z.object({
  periodEnding: z.string(),
  periodType: z.string().nullable().optional(),

  // Income statement
  totalRevenue: num,
  costOfRevenue: num,
  grossProfit: num,
  researchAndDevelopment: num,
  sellingGeneralAndAdmin: num,
  operatingExpense: num,
  operatingIncome: num,
  ebit: num,
  ebitda: num,
  interestExpense: num,
  interestIncome: num,
  otherIncomeExpense: num,
  pretaxIncome: num,
  taxProvision: num,
  netIncome: num,
  basicEps: num,
  dilutedEps: num,

  // Balance sheet — assets
  totalAssets: num,
  currentAssets: num,
  cashAndEquivalents: num,
  accountsReceivable: num,
  inventory: num,
  otherCurrentAssets: num,
  netPPE: num,
  grossPPE: num,
  accumulatedDepreciation: num,
  goodwill: num,
  otherIntangibleAssets: num,
  longTermInvestments: num,
  otherNonCurrentAssets: num,
  netTangibleAssets: num,

  // Balance sheet — liabilities & equity
  totalLiabilities: num,
  currentLiabilities: num,
  accountsPayable: num,
  currentDebt: num,
  otherCurrentLiabilities: num,
  longTermDebt: num,
  otherNonCurrentLiabilities: num,
  totalDebt: num,
  netDebt: num,
  totalEquity: num,
  commonStockEquity: num,
  preferredStockEquity: num,
  retainedEarnings: num,
  treasurySharesNumber: num,
  treasuryStockValue: num,
  minorityInterest: num,
  workingCapital: num,
  investedCapital: num,

  // Cash flow
  operatingCashFlow: num,
  investingCashFlow: num,
  financingCashFlow: num,
  freeCashFlow: num,
  capitalExpenditure: num,
  depreciationAmortization: num,
  changeInWorkingCapital: num,
  stockBasedCompensation: num,
  dividendsPaid: num,
  repurchaseOfCapitalStock: num,
  issuanceOfCapitalStock: num,
  repaymentOfDebt: num,
  issuanceOfDebt: num,
  netBusinessPurchaseAndSale: num,
  beginningCashPosition: num,
  endingCashPosition: num,
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

// ── Alt data sub-graphs ───────────────────────────────────────────────────

export const ClinicalTrialSchema = z.object({
  /** NCT identifier (e.g. NCT05123456). */
  nctId: z.string(),
  /** Official study title. */
  title: z.string(),
  /** Trial phase (e.g. PHASE1, PHASE2, PHASE3). Null if unspecified. */
  phase: z.string().nullable().optional(),
  /** Recruitment / completion status (e.g. RECRUITING, COMPLETED). */
  status: z.string().nullable().optional(),
  /** Disease / condition names studied. */
  conditions: z.array(z.string()),
  /** Intervention names (drug, device, procedure). */
  interventions: z.array(z.string()),
  /** Lead sponsor name. */
  sponsor: z.string().nullable().optional(),
  /** Study start date (YYYY-MM-DD). */
  startDate: z.string().nullable().optional(),
  /** Primary completion date (YYYY-MM-DD). */
  completionDate: z.string().nullable().optional(),
  /** Enrolled participant count. */
  enrollment: z.number().nullable().optional(),
});
export type ClinicalTrial = z.infer<typeof ClinicalTrialSchema>;

export const FdaEventTypeSchema = z.enum(['DRUG_ADVERSE', 'DEVICE_ADVERSE', 'DRUG_RECALL']);
export type FdaEventType = z.infer<typeof FdaEventTypeSchema>;

export const FdaEventSchema = z.object({
  /** Upstream record identifier (safety report, MDR key, or recall number). */
  id: z.string(),
  /** Event kind. */
  type: FdaEventTypeSchema,
  /** Report date (YYYY-MM-DD). */
  reportDate: z.string().nullable().optional(),
  /** Severity — adverse-event outcome flag, or FDA recall class (I/II/III). */
  severity: z.string().nullable().optional(),
  /** Short free-text summary (device narrative or reason for recall). */
  summary: z.string().nullable().optional(),
  /** Product name (brand or generic). */
  product: z.string().nullable().optional(),
});
export type FdaEvent = z.infer<typeof FdaEventSchema>;

export const LitigationCaseSchema = z.object({
  /** Docket / opinion cluster id. */
  id: z.string(),
  /** Case name, e.g. 'United States v. Foo Corp'. */
  caseName: z.string(),
  /** Court short code or full name. */
  court: z.string().nullable().optional(),
  /** Case filing date (YYYY-MM-DD). */
  dateFiled: z.string().nullable().optional(),
  /** Case termination date (YYYY-MM-DD). */
  dateTerminated: z.string().nullable().optional(),
  /** Docket number as filed. */
  docketNumber: z.string().nullable().optional(),
  /** Nature of suit classification. */
  natureOfSuit: z.string().nullable().optional(),
  /** Fully-qualified docket URL. */
  absoluteUrl: z.string().nullable().optional(),
});
export type LitigationCase = z.infer<typeof LitigationCaseSchema>;

export const GovernmentContractSchema = z.object({
  /** Award ID (PIID or equivalent). */
  awardId: z.string(),
  /** Recipient name as reported. */
  recipient: z.string(),
  /** Action date (YYYY-MM-DD). */
  actionDate: z.string().nullable().optional(),
  /** Award amount in USD. Null when the upstream record does not report a value. */
  amount: z.number().nullable().optional(),
  /** Awarding agency. */
  agency: z.string().nullable().optional(),
  /** Award type (BPA Call, IDV, Definitive Contract, etc.). */
  awardType: z.string().nullable().optional(),
  /** Contract description. */
  description: z.string().nullable().optional(),
});
export type GovernmentContract = z.infer<typeof GovernmentContractSchema>;

// ── Subsidiaries (Exhibit 21) ─────────────────────────────────────────────

export const SubsidiarySchema = z.object({
  /** Legal name as it appears in the exhibit. */
  name: z.string(),
  /** State or country of incorporation. Null when the filing omits it. */
  jurisdiction: z.string().nullable().optional(),
});
export type Subsidiary = z.infer<typeof SubsidiarySchema>;

export const SubsidiaryListSchema = z.object({
  /** SEC accession number of the source filing. */
  accessionNumber: z.string(),
  /** Form type (10-K, 10-K/A, 20-F, 20-F/A). */
  form: z.string(),
  /** Filing date (YYYY-MM-DD). */
  filingDate: z.string(),
  /** Landing page URL for the filing. */
  filingUrl: z.string(),
  /** Direct URL to the Exhibit 21 attachment. */
  exhibitUrl: z.string(),
  /** Subsidiaries in the order they appeared in the exhibit. */
  subsidiaries: z.array(SubsidiarySchema),
  /** Count of parsed subsidiaries. */
  count: z.number(),
});
export type SubsidiaryList = z.infer<typeof SubsidiaryListSchema>;

// ── Concentration (HHI + top-N shares) ────────────────────────────────────

export const ConcentrationComponentSchema = z.object({
  /** Human-readable label (e.g. 'iPhone', 'Americas', 'Customer A'). */
  label: z.string(),
  /** Raw XBRL member qname (e.g. 'aapl:IPhoneMember'). */
  member: z.string(),
  /** Value in USD for this period. */
  value: z.number(),
  /** Share of the dimension total, 0..1. */
  share: z.number(),
});
export type ConcentrationComponent = z.infer<typeof ConcentrationComponentSchema>;

export const ConcentrationBreakdownSchema = z.object({
  /** Herfindahl-Hirschman Index (0..10000). Null when fewer than 2 components. */
  hhi: z.number().nullable().optional(),
  /** Number of components summed. */
  count: z.number(),
  /** Sum of all component values (USD). */
  total: z.number(),
  /** Components sorted by value descending. */
  components: z.array(ConcentrationComponentSchema),
});
export type ConcentrationBreakdown = z.infer<typeof ConcentrationBreakdownSchema>;

export const ConcentrationProfileSchema = z.object({
  /** Accession number of the source filing used for this rollup. */
  accessionNumber: z.string().nullable().optional(),
  /** Form type (10-K, 10-Q, 20-F) of the source filing. */
  form: z.string().nullable().optional(),
  /** Filing date (YYYY-MM-DD) of the source filing. */
  filingDate: z.string().nullable().optional(),
  /** Period end (YYYY-MM-DD) the rollup represents. */
  periodEnd: z.string().nullable().optional(),
  /** Product or service-line concentration. */
  product: ConcentrationBreakdownSchema.nullable().optional(),
  /** Reportable business segment concentration. */
  segment: ConcentrationBreakdownSchema.nullable().optional(),
  /** Geographic concentration. */
  geography: ConcentrationBreakdownSchema.nullable().optional(),
  /** Customer concentration — only XBRL MajorCustomersAxis members (typically >10% of revenue). */
  customer: ConcentrationBreakdownSchema.nullable().optional(),
});
export type ConcentrationProfile = z.infer<typeof ConcentrationProfileSchema>;

// ── Relationships (unified typed-edge graph) ──────────────────────────────

export const RelationshipSourceSchema = z.object({
  /** Source category for this edge — one of: 'corporate-filing', 'government-award', 'institutional-holding', 'litigation', 'clinical-trial'. */
  connector: z.string(),
  /** URL to the source record. Null when the connector only exposes IDs. */
  url: z.string().nullable().optional(),
  /** ISO 8601 date the relationship was disclosed / recorded upstream. */
  asOf: z.string().nullable().optional(),
  /** Optional ID from the source record (accession number, award ID, NCT ID, docket number). */
  ref: z.string().nullable().optional(),
});
export type RelationshipSource = z.infer<typeof RelationshipSourceSchema>;

export const RelationshipEdgeSchema = z.object({
  /** Edge kind — customer, subsidiary, partner, etc. */
  type: RelationshipTypeSchema,
  /** OUT = subject → counterparty. IN = counterparty → subject. */
  direction: RelationshipDirectionSchema,
  /** Who disclosed this relationship. */
  disclosure: RelationshipDisclosureSchema,
  /** 0..1 confidence score. 1.0 for structured / regulator-filed data. */
  confidence: z.number(),
  /** Counterparty display name. May be anonymized ('Customer A') when the filing redacts. */
  counterpartyName: z.string(),
  /** Ticker symbol of the counterparty, if resolved. Null is common. */
  counterpartyTicker: z.string().nullable().optional(),
  /** SEC CIK of the counterparty, if resolved. */
  counterpartyCik: z.string().nullable().optional(),
  /** Share of subject attributable to counterparty (0..1), where upstream discloses it. */
  sharePct: z.number().nullable().optional(),
  /** Absolute value in USD where upstream discloses it (disclosed customer revenue, award total, 13F market value). */
  valueUsd: z.number().nullable().optional(),
  /** Free-text context — jurisdiction, NCT ID, docket number, agency sub-office, etc. */
  context: z.string().nullable().optional(),
  /** ISO 8601 date the edge was first observed. For single-snapshot adapters this equals lastConfirmedAt. Null when the underlying source has no date. Optional for back-compat with pre-0.25.0 servers. */
  firstSeenAt: z.string().nullable().optional(),
  /** ISO 8601 date of the most recent observation confirming this edge. Equals source.asOf for single-snapshot adapters. Null when the underlying source has no date. Optional for back-compat with pre-0.25.0 servers. */
  lastConfirmedAt: z.string().nullable().optional(),
  /** Provenance — which connector emitted this edge. */
  source: RelationshipSourceSchema,
});
export type RelationshipEdge = z.infer<typeof RelationshipEdgeSchema>;

export const ParentSourceSchema = z.object({
  /** Connector that emitted this pointer — 'sec-13d'. */
  connector: z.string(),
  /** URL to the Schedule 13D/G filing's EDGAR landing page. */
  url: z.string().nullable().optional(),
  /** ISO 8601 'as of' date from the filing. */
  asOf: z.string().nullable().optional(),
  /** Accession number of the Schedule 13D/G filing. */
  ref: z.string().nullable().optional(),
});
export type ParentSource = z.infer<typeof ParentSourceSchema>;

export const ParentCompanySchema = z.object({
  /** Parent display name as reported in the Schedule 13D/G filing. */
  name: z.string(),
  /** SEC CIK of the parent (10-digit padded). */
  cik: z.string(),
  /** Percent of voting shares owned (0..100). */
  percentOwned: z.number(),
  /** Source filing provenance. */
  source: ParentSourceSchema,
});
export type ParentCompany = z.infer<typeof ParentCompanySchema>;

export const MacroObservationSchema = z.object({
  /** Observation date (YYYY-MM-DD). */
  date: z.string(),
  /** Observed value. Null when the upstream reports missing data. */
  value: z.number().nullable().optional(),
});
export type MacroObservation = z.infer<typeof MacroObservationSchema>;

export const MacroSeriesSchema = z.object({
  /** Series identifier (e.g. GDPC1, UNRATE). */
  id: z.string(),
  /** Series title. */
  title: z.string().nullable().optional(),
  /** Units of measure. */
  units: z.string().nullable().optional(),
  /** Observation frequency ('Annual', 'Quarterly', 'Monthly', 'Daily'). */
  frequency: z.string().nullable().optional(),
  /** Last update timestamp. */
  lastUpdated: z.string().nullable().optional(),
  /** Time-series observations, newest first by default. */
  observations: z.array(MacroObservationSchema).optional(),
});
export type MacroSeries = z.infer<typeof MacroSeriesSchema>;

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
  clinicalTrials: z.array(ClinicalTrialSchema).optional(),
  fdaEvents: z.array(FdaEventSchema).optional(),
  litigation: z.array(LitigationCaseSchema).optional(),
  governmentContracts: z.array(GovernmentContractSchema).optional(),
  subsidiaries: SubsidiaryListSchema.nullable().optional(),
  concentration: ConcentrationProfileSchema.nullable().optional(),
  relationships: z.array(RelationshipEdgeSchema).optional(),
  parent: ParentCompanySchema.nullable().optional(),
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

/**
 * One x402 v2 payment option, as advertised by the server in the
 * `PAYMENT-REQUIRED` header on a 402 response.
 *
 * Mirrors the `accepts[]` entries in the OpenAPI `X402Quote` schema at
 * `https://api.jintel.ai/openapi.json`. Atomic `amount` is in the asset's
 * smallest unit (USDC has 6 decimals on Base).
 */
export interface X402PaymentRequirements {
  scheme: string;
  /** CAIP-2 network identifier, e.g. `eip155:8453` for Base. */
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
}

/**
 * Parsed `X402Quote` envelope. Delivered base64-encoded in the
 * `PAYMENT-REQUIRED` response header on a 402 from `POST /api/graphql`.
 */
export interface X402Quote {
  x402Version: 2;
  resource: { url: string; description?: string; mimeType?: string };
  accepts: X402PaymentRequirements[];
  error?: string;
  extensions?: Record<string, unknown>;
}

/**
 * Minimal `fetch` shape the client needs. Compatible with the global `fetch`
 * and with payment middlewares like `x402-fetch`'s `wrapFetchWithPayment`.
 */
export type JintelFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface JintelClientConfig {
  /** API base URL. Defaults to https://api.jintel.ai/api */
  baseUrl?: string;
  /**
   * API key for Bearer auth. Optional when `fetch` is provided (e.g. an
   * `x402-fetch`-wrapped fetch handles auth via on-chain payment instead).
   * At least one of `apiKey` or `fetch` must be supplied.
   */
  apiKey?: string;
  /**
   * Custom `fetch` implementation. Pass an `x402-fetch`-wrapped fetch to
   * pay per query in USDC on Base — the wrapper handles the 402 → sign →
   * retry handshake transparently. Defaults to the global `fetch`.
   *
   * @example
   * ```ts
   * import { wrapFetchWithPayment } from 'x402-fetch';
   * import { privateKeyToAccount } from 'viem/accounts';
   * const account = privateKeyToAccount(process.env.WALLET_KEY as `0x${string}`);
   * const client = new JintelClient({ fetch: wrapFetchWithPayment(fetch, account) });
   * ```
   */
  fetch?: JintelFetch;
  timeout?: number;
  debug?: boolean;
  /**
   * Enable in-process response caching.
   * Pass `true` for defaults, or an object to customise per-method TTLs.
   * Eliminates redundant HTTP calls when the same data is requested within a short window
   * (e.g. multiple micro research cycles, ReflectionEngine per-ticker price lookups).
   */
  cache?: boolean | JintelClientCacheConfig;
  /**
   * Default point-in-time bound applied to every query that supports it.
   * ISO 8601 timestamp. Per-call `asOf` overrides this. Use this to lock an
   * entire backtest run to a single replay date.
   *
   * When set, every response reflects what was knowable at this timestamp:
   * SUPPORTED sub-graphs are date-bounded; UNSUPPORTED sub-graphs (live
   * quotes, current fundamentals, OFAC SDN, etc.) return `null`/`[]` rather
   * than serve current data. The `extensions.asOf.fields` map (see
   * {@link AsOfExtension}) reports the per-field PIT class on every reply.
   */
  asOf?: string;
}

/** Options accepted by every method that maps to an `asOf`-aware query. */
export interface AsOfOption {
  /** Point-in-time bound for this call (ISO 8601). Overrides the client-level default. */
  asOf?: string;
}

/**
 * Per-field PIT classification surfaced in `extensions.asOf.fields` whenever
 * the request was point-in-time. Mirrors the server-side
 * `docs/agent-native-pivot/asof-spec.md` §8 envelope.
 */
export interface AsOfFieldPolicy {
  /** SUPPORTED — honored honestly. BEST_EFFORT — bounded but with caveat. UNSUPPORTED — short-circuited to null. */
  class: 'SUPPORTED' | 'BEST_EFFORT' | 'UNSUPPORTED';
  coverageStart?: string;
  warning?: string;
}

export interface AsOfExtension {
  /** The original ISO timestamp the caller sent. */
  requested: string | null;
  /** Per-field policy keyed by GraphQL field path (`Type.field`). */
  fields: Record<string, AsOfFieldPolicy>;
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
  | 'periodicFilings'
  | 'clinicalTrials'
  | 'fdaEvents'
  | 'litigation'
  | 'governmentContracts'
  | 'subsidiaries'
  | 'concentration'
  | 'relationships'
  | 'parent';

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
  /** Restrict to one or more source names (case-insensitive exact match). */
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

/** Filter for sanctions matches (`RegulatoryData.sanctions` and root `sanctionsScreen`). */
export interface SanctionsFilterOptions {
  /** Only return matches with score >= this value (0-100). */
  minScore?: number;
  /** Restrict to one or more sanctions list names (e.g. `['SDN']`). */
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
  /** Only include holders with position value >= this amount (whole USD — server normalizes 13F unit ambiguity at parse time). */
  minValue?: number;
  /** Number of holders to skip for pagination (default 0). */
  offset?: number;
}

/** Filter for `Entity.institutionalHoldings` and root `institutionalHoldings` (InstitutionalHoldingsFilterInput). */
export interface InstitutionalHoldingsFilterOptions extends ArraySubGraphOptions {
  /** Only include holdings with value >= this amount (whole USD — server normalizes 13F unit ambiguity at parse time). */
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

/** Filter for `Entity.clinicalTrials` (ClinicalTrialFilterInput). */
export interface ClinicalTrialFilterOptions extends ArraySubGraphOptions {
  /** Case-insensitive phase match (e.g. 'PHASE3' or 'PHASE'). */
  phase?: string;
  /** Exact status match (e.g. 'RECRUITING', 'COMPLETED'). */
  status?: string;
  /** Number of rows to skip for pagination (default 0). */
  offset?: number;
}

/** Filter for `Entity.fdaEvents` (FdaEventFilterInput). */
export interface FdaEventFilterOptions extends ArraySubGraphOptions {
  /** Restrict to one or more event kinds. */
  types?: FdaEventType[];
  /** Exact severity match — 'CLASS I' / 'CLASS II' / 'CLASS III' for recalls, or an outcome flag for adverse events. */
  severity?: string;
  /** Number of rows to skip for pagination (default 0). */
  offset?: number;
}

/** Filter for `Entity.litigation` (LitigationFilterInput). */
export interface LitigationFilterOptions extends ArraySubGraphOptions {
  /** Only include cases with no dateTerminated (still open). */
  onlyActive?: boolean;
  /** Case-insensitive substring match against court name/citation (e.g. 'N.D. CAL'). */
  court?: string;
  /** Case-insensitive substring match against nature of suit (e.g. 'PATENT', 'ANTITRUST'). */
  natureOfSuit?: string;
  /** Number of rows to skip for pagination (default 0). */
  offset?: number;
}

/** Filter for `Entity.governmentContracts` (GovernmentContractFilterInput). */
export interface GovernmentContractFilterOptions extends ArraySubGraphOptions {
  /** Only include contracts whose amount is >= this value (USD). */
  minAmount?: number;
  /** Number of rows to skip for pagination (default 0). */
  offset?: number;
}

/**
 * Filter for `Entity.relationships` (RelationshipFilterInput).
 * The unified relationship graph accepts domain-specific filters in addition to generic date/limit/sort.
 */
export interface RelationshipFilterOptions {
  /** Restrict to one or more edge types. */
  types?: RelationshipType[];
  /** Restrict to one or more directions (default: both). */
  directions?: RelationshipDirection[];
  /** Only include edges with confidence >= this value (0..1). */
  minConfidence?: number;
  /** Only include edges with valueUsd >= this amount. */
  minValue?: number;
  /** Only include edges whose source.asOf is on or after this ISO 8601 date. */
  since?: string;
  /** Only include edges whose source.asOf is on or before this ISO 8601 date. */
  until?: string;
  /** Cap the result count (default 50, hard cap 500). */
  limit?: number;
  /** Offset for pagination, applied after sort and before limit. */
  offset?: number;
  /** Sort direction by source.asOf (default DESC — most recent first). */
  sort?: 'ASC' | 'DESC';
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
  /** Filter for `Entity.clinicalTrials`. */
  clinicalTrialsFilter?: ClinicalTrialFilterOptions;
  /** Filter for `Entity.fdaEvents`. */
  fdaEventsFilter?: FdaEventFilterOptions;
  /** Filter for `Entity.litigation`. */
  litigationFilter?: LitigationFilterOptions;
  /** Filter for `Entity.governmentContracts`. */
  governmentContractsFilter?: GovernmentContractFilterOptions;
  /** Filter for `Entity.relationships` — unified typed-edge graph. */
  relationshipsFilter?: RelationshipFilterOptions;
  /** Filter for `financials.income/balanceSheet/cashFlow`. */
  financialStatementsFilter?: FinancialStatementFilterOptions;
  /** Filter for `regulatory.sanctions`. */
  sanctionsFilter?: SanctionsFilterOptions;
  /** Filter for `regulatory.campaignFinance`. */
  campaignFinanceFilter?: CampaignFinanceFilterOptions;
  /**
   * Point-in-time bound (ISO 8601). Bounds every sub-graph in the resulting
   * query to data knowable at this timestamp. UNSUPPORTED sub-graphs (live
   * quotes, current fundamentals, etc.) short-circuit to null.
   */
  asOf?: string;
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
  'clinicalTrials',
  'fdaEvents',
  'litigation',
  'governmentContracts',
  'subsidiaries',
  'concentration',
  'relationships',
  'parent',
];
