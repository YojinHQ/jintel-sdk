import type {
  ArraySubGraphOptions,
  EnrichmentField,
  EnrichOptions,
  FilingsFilterOptions,
  FuturesCurveFilterOptions,
  OptionsChainFilterOptions,
  RiskSignalFilterOptions,
  TopHoldersOptions,
} from './types.js';

// ── Field Fragments ────────────────────────────────────────────────────────

export const MARKET_QUOTE_FIELDS = `
  quote {
    ticker
    price
    open
    high
    low
    previousClose
    change
    changePercent
    volume
    marketCap
    preMarketPrice
    preMarketChange
    preMarketChangePercent
    postMarketPrice
    postMarketChange
    postMarketChangePercent
    timestamp
    source
  }`;

export const FUNDAMENTALS_FIELDS = `
  fundamentals {
    marketCap
    revenue
    netIncome
    eps
    peRatio
    dividendYield
    beta
    fiftyTwoWeekHigh
    fiftyTwoWeekLow
    debtToEquity
    sector
    industry
    exchange
    currency
    description
    employees
    website
    earningsDate
    priceToBook
    bookValue
    earningsHistory {
      period
      epsActual
      epsEstimate
      epsDifference
      surprisePercent
    }
    forwardPE
    pegRatio
    evToEbitda
    priceToSales
    epsForward
    grossMargin
    operatingMargin
    netMargin
    returnOnEquity
    returnOnAssets
    exDividendDate
    payoutRatio
    annualDividendPerShare
    revenueGrowth
    earningsGrowth
    source
  }`;

export const RISK_FIELDS = `
  risk {
    overallScore
    signals {
      type
      severity
      description
      source
      date
    }
    sanctionsHits
    adverseMediaHits
    regulatoryActions
  }`;

export const SHORT_INTEREST_FIELDS = `
  shortInterest {
    ticker
    reportDate
    shortInterest
    change
    daysToCover
    source
  }`;

export const CAMPAIGN_FINANCE_FIELDS = `
  campaignFinance {
    id
    name
    type
    party
    state
    totalRaised
    totalSpent
    cycle
  }`;

export const REGULATORY_FIELDS = `
  regulatory {
    sanctions {
      listName
      matchedName
      score
      details
      uid
      sdnType
      programs
    }
    filings {
      type
      date
      url
      description
    }
    campaignFinance {
      id
      name
      type
      party
      state
      totalRaised
      totalSpent
      cycle
    }
  }`;

export const TECHNICALS_FIELDS = `
  technicals {
    ticker
    rsi
    macd { macd signal histogram }
    bollingerBands { upper middle lower }
    ema
    sma
    atr
    vwma
    mfi
    sma20
    sma200
    ema50
    ema200
    wma52
    crossovers { goldenCross deathCross emaCross }
    adx
    stochastic { k d }
    obv
    vwap
    parabolicSar
    bollingerBandsWidth
    williamsR
  }`;

export const DERIVATIVES_FIELDS = `
  derivatives {
    futures { date expiration price }
    options {
      contractSymbol expiration strike optionType
      openInterest volume lastTradePrice bid ask
      impliedVolatility delta gamma theta vega
    }
  }`;

export const NEWS_FIELDS = `
  news {
    title
    link
    snippet
    source
    date
    imageUrl
    sentimentScore
  }`;

export const RESEARCH_FIELDS = `
  research {
    title
    url
    publishedDate
    author
    text
    score
  }`;

export const SENTIMENT_FIELDS = `
  sentiment {
    ticker
    name
    rank
    mentions
    upvotes
    rank24hAgo
    mentions24hAgo
  }`;

export const SOCIAL_FIELDS = `
  social {
    reddit {
      id
      title
      subreddit
      author
      score
      numComments
      url
      text
      date
      isLinkPost
      linkDomain
    }
    redditComments {
      id
      body
      author
      subreddit
      score
      date
      parentId
      postId
    }
  }`;

export const PREDICTIONS_FIELDS = `
  predictions {
    eventId
    title
    url
    outcomes { name probability }
    outcomesRemaining
    priceMovement
    volume24hr
    volume1mo
    liquidity
    date
    endDate
  }`;

export const DISCUSSIONS_FIELDS = `
  discussions {
    objectId
    title
    url
    hnUrl
    author
    date
    points
    numComments
    topComments { author text points }
  }`;

export const FINANCIALS_FIELDS = `
  financials {
    income {
      periodEnding
      periodType
      totalRevenue
      costOfRevenue
      grossProfit
      researchAndDevelopment
      sellingGeneralAndAdmin
      operatingExpense
      operatingIncome
      ebit
      ebitda
      netIncome
      basicEps
      dilutedEps
      totalAssets
      totalLiabilities
      totalEquity
      cashAndEquivalents
      totalDebt
      currentAssets
      currentLiabilities
      retainedEarnings
      operatingCashFlow
      investingCashFlow
      financingCashFlow
      freeCashFlow
      capitalExpenditure
      dividendsPaid
      stockBasedCompensation
    }
    balanceSheet {
      periodEnding
      periodType
      totalRevenue
      costOfRevenue
      grossProfit
      researchAndDevelopment
      sellingGeneralAndAdmin
      operatingExpense
      operatingIncome
      ebit
      ebitda
      netIncome
      basicEps
      dilutedEps
      totalAssets
      totalLiabilities
      totalEquity
      cashAndEquivalents
      totalDebt
      currentAssets
      currentLiabilities
      retainedEarnings
      operatingCashFlow
      investingCashFlow
      financingCashFlow
      freeCashFlow
      capitalExpenditure
      dividendsPaid
      stockBasedCompensation
    }
    cashFlow {
      periodEnding
      periodType
      totalRevenue
      costOfRevenue
      grossProfit
      researchAndDevelopment
      sellingGeneralAndAdmin
      operatingExpense
      operatingIncome
      ebit
      ebitda
      netIncome
      basicEps
      dilutedEps
      totalAssets
      totalLiabilities
      totalEquity
      cashAndEquivalents
      totalDebt
      currentAssets
      currentLiabilities
      retainedEarnings
      operatingCashFlow
      investingCashFlow
      financingCashFlow
      freeCashFlow
      capitalExpenditure
      dividendsPaid
      stockBasedCompensation
    }
  }`;

export const EXECUTIVES_FIELDS = `
  executives {
    name
    title
    pay
    yearBorn
    age
    exercisedValue
    unexercisedValue
  }`;

export const INSTITUTIONAL_HOLDINGS_FIELDS = `
  institutionalHoldings {
    issuerName
    cusip
    titleOfClass
    value
    shares
    sharesOrPrincipal
    investmentDiscretion
    reportDate
    filingDate
  }`;

export const OWNERSHIP_FIELDS = `
  ownership {
    symbol
    insiderOwnership
    institutionOwnership
    institutionFloatOwnership
    institutionsCount
    outstandingShares
    floatShares
    shortInterest
    shortPercentOfFloat
    daysToCover
    shortInterestPrevMonth
    shortInterestDate
  }`;

export const ANALYST_FIELDS = `
  analyst {
    targetHigh
    targetLow
    targetMean
    targetMedian
    recommendation
    recommendationMean
    numberOfAnalysts
  }`;

export const TOP_HOLDERS_FIELDS = `
  topHolders {
    filerName
    cik
    value
    shares
    reportDate
    filingDate
  }`;

export const INSIDER_TRADES_FIELDS = `
  insiderTrades {
    accessionNumber
    filingUrl
    reporterName
    reporterCik
    officerTitle
    isOfficer
    isDirector
    isTenPercentOwner
    isUnder10b5One
    securityTitle
    transactionDate
    transactionCode
    acquiredDisposed
    shares
    pricePerShare
    transactionValue
    sharesOwnedFollowingTransaction
    ownershipType
    isDerivative
    filingDate
  }`;

export const EARNINGS_PRESS_RELEASES_FIELDS = `
  earningsPressReleases {
    accessionNumber
    filingDate
    reportDate
    items
    filingUrl
    pressReleaseUrl
    body
    excerpt
    bodyLength
    guidance { text metric period direction }
  }`;

export const EARNINGS_FIELDS = `
  earnings {
    period
    reportDate
    quarter
    year
    epsActual
    epsEstimate
    revenueActual
    revenueEstimate
    surprisePercent
    revenueSurprisePercent
    hour
  }`;

export const PERIODIC_FILINGS_FIELDS = `
  periodicFilings {
    accessionNumber
    form
    filingDate
    reportDate
    filingUrl
    documentUrl
    sections {
      item
      title
      body
      excerpt
      bodyLength
    }
  }`;

export const SEGMENTED_REVENUE_FIELDS = `
  segmentedRevenue {
    accessionNumber
    filingUrl
    form
    filingDate
    reportDate
    dimension
    axis
    member
    segment
    value
    startDate
    endDate
    concept
  }`;

export const HISTORY_FIELDS = `
  history {
    date
    open
    high
    low
    close
    volume
  }`;

export const KEY_EVENTS_FIELDS = `
  keyEvents {
    date
    type
    description
    priceChange
    changePercent
    close
    volume
  }`;

// ── Static Queries ─────────────────────────────────────────────────────────

export const SEARCH_ENTITIES = `
  query SearchEntities($query: String!, $type: EntityType, $limit: Int) {
    searchEntities(query: $query, type: $type, limit: $limit) {
      id
      name
      type
      tickers
      domain
      country
    }
  }`;

export const ENTITY = `
  query Entity($id: ID!) {
    entity(id: $id) {
      id
      name
      type
      tickers
      domain
      country
    }
  }`;

export const ENTITY_BY_TICKER = `
  query EntityByTicker($ticker: String!) {
    entityByTicker(ticker: $ticker) {
      id
      name
      type
      tickers
      domain
      country
    }
  }`;

export const QUOTES = `
  query Quotes($tickers: [String!]!) {
    quotes(tickers: $tickers) {
      ticker
      price
      open
      high
      low
      previousClose
      change
      changePercent
      volume
      marketCap
      preMarketPrice
      preMarketChange
      preMarketChangePercent
      postMarketPrice
      postMarketChange
      postMarketChangePercent
      timestamp
      source
    }
  }`;

/** @deprecated Use QUOTES instead */
export const BATCH_QUOTES = QUOTES;

export const SANCTIONS_SCREEN = `
  query SanctionsScreen($name: String!, $country: String) {
    sanctionsScreen(name: $name, country: $country) {
      listName
      matchedName
      score
      details
      uid
      sdnType
      programs
    }
  }`;

export const GDP = `
  query Gdp($country: String!, $type: GdpType, $filter: ArrayFilterInput) {
    gdp(country: $country, type: $type, filter: $filter) {
      date
      country
      value
    }
  }`;

export const INFLATION = `
  query Inflation($country: String!, $filter: ArrayFilterInput) {
    inflation(country: $country, filter: $filter) {
      date
      country
      value
    }
  }`;

export const INTEREST_RATES = `
  query InterestRates($country: String!, $filter: ArrayFilterInput) {
    interestRates(country: $country, filter: $filter) {
      date
      country
      value
    }
  }`;

export const SP500_MULTIPLES = `
  query SP500Multiples($series: SP500Series!, $filter: ArrayFilterInput) {
    sp500Multiples(series: $series, filter: $filter) {
      date
      name
      value
    }
  }`;

export const PRICE_HISTORY = `
  query PriceHistory($tickers: [String!]!, $range: String, $interval: String) {
    priceHistory(tickers: $tickers, range: $range, interval: $interval) {
      ticker
      history {
        date
        open
        high
        low
        close
        volume
      }
    }
  }`;

export const FAMA_FRENCH_FACTORS = `
  query FamaFrenchFactors($series: FamaFrenchSeries!, $range: String, $filter: ArrayFilterInput) {
    famaFrenchFactors(series: $series, range: $range, filter: $filter) {
      date
      mktRf
      smb
      hml
      rmw
      cma
      rf
    }
  }`;

export const SHORT_INTEREST = `
  query ShortInterest($ticker: String!, $filter: ArrayFilterInput) {
    shortInterest(ticker: $ticker, filter: $filter) {
      ticker
      reportDate
      shortInterest
      change
      daysToCover
      source
    }
  }`;

export const CAMPAIGN_FINANCE = `
  query CampaignFinance($name: String!, $cycle: Int) {
    campaignFinance(name: $name, cycle: $cycle) {
      id
      name
      type
      party
      state
      totalRaised
      totalSpent
      cycle
    }
  }`;

export const INSTITUTIONAL_HOLDINGS = `
  query InstitutionalHoldings($cik: String!, $filter: ArrayFilterInput) {
    institutionalHoldings(cik: $cik, filter: $filter) {
      issuerName
      cusip
      titleOfClass
      value
      shares
      sharesOrPrincipal
      investmentDiscretion
      reportDate
      filingDate
    }
  }`;

export const MARKET_STATUS = `
  query MarketStatus {
    marketStatus {
      isOpen
      isTradingDay
      session
      holiday
      date
    }
  }`;

// ── Dynamic Query Builder ──────────────────────────────────────────────────

/** True when any ArrayFilterInput dimension is set. */
function hasAnyField(opts: ArraySubGraphOptions | undefined | null): boolean {
  if (!opts) return false;
  return opts.since != null || opts.until != null || opts.limit != null || opts.sort != null;
}

function hasFilingsFilter(f: FilingsFilterOptions | undefined): boolean {
  if (!f) return false;
  if (hasAnyField(f)) return true;
  return Array.isArray(f.types) && f.types.length > 0;
}

function hasRiskSignalFilter(f: RiskSignalFilterOptions | undefined): boolean {
  if (!f) return false;
  if (hasAnyField(f)) return true;
  if (Array.isArray(f.types) && f.types.length > 0) return true;
  return Array.isArray(f.severities) && f.severities.length > 0;
}

function hasFuturesFilter(f: FuturesCurveFilterOptions | undefined): boolean {
  if (!f) return false;
  return f.since != null || f.until != null || f.limit != null || f.sort != null;
}

function hasOptionsFilter(f: OptionsChainFilterOptions | undefined): boolean {
  if (!f) return false;
  return (
    f.since != null ||
    f.until != null ||
    f.strikeMin != null ||
    f.strikeMax != null ||
    f.optionType != null ||
    f.minVolume != null ||
    f.minOpenInterest != null ||
    f.limit != null ||
    f.sort != null
  );
}

interface BuildFlags {
  hasFilter: boolean;
  hasFilingsFilter: boolean;
  hasRiskSignalFilter: boolean;
  hasFuturesFilter: boolean;
  hasOptionsFilter: boolean;
  hasTopHoldersPagination: boolean;
}

/** Inline `(filter: $filter)` onto a nested field inside an aggregate block. */
function withFilterArg(block: string, fieldName: string, varName: string): string {
  return block.replace(new RegExp(`\\b${fieldName}\\s*{`), `${fieldName}(filter: $${varName}) {`);
}

/** market sub-graph — three inner fields accept ArrayFilterInput. */
function marketBlock(hasFilter: boolean): string {
  const history = hasFilter ? withFilterArg(HISTORY_FIELDS.trim(), 'history', 'filter') : HISTORY_FIELDS.trim();
  const keyEvents = hasFilter ? withFilterArg(KEY_EVENTS_FIELDS.trim(), 'keyEvents', 'filter') : KEY_EVENTS_FIELDS.trim();
  const shortInt = hasFilter
    ? withFilterArg(SHORT_INTEREST_FIELDS.trim(), 'shortInterest', 'filter')
    : SHORT_INTEREST_FIELDS.trim();
  return `market {\n    ${MARKET_QUOTE_FIELDS.trim()}\n    ${FUNDAMENTALS_FIELDS.trim()}\n    ${history}\n    ${keyEvents}\n    ${shortInt}\n  }`;
}

/** regulatory sub-graph — filings accepts FilingsFilterInput. */
function regulatoryBlock(hasFilings: boolean): string {
  if (!hasFilings) return REGULATORY_FIELDS.trim();
  return withFilterArg(REGULATORY_FIELDS.trim(), 'filings', 'filingsFilter');
}

/** risk sub-graph — signals accepts RiskSignalFilterInput. */
function riskBlock(hasRiskSignal: boolean): string {
  if (!hasRiskSignal) return RISK_FIELDS.trim();
  return withFilterArg(RISK_FIELDS.trim(), 'signals', 'riskSignalFilter');
}

/** derivatives sub-graph — futures and options each take their own filter input. */
function derivativesBlock(hasFutures: boolean, hasOptions: boolean): string {
  let block = DERIVATIVES_FIELDS.trim();
  if (hasFutures) block = withFilterArg(block, 'futures', 'futuresFilter');
  if (hasOptions) block = withFilterArg(block, 'options', 'optionsFilter');
  return block;
}

/** financials sub-graph — income / balanceSheet / cashFlow each take ArrayFilterInput. */
function financialsBlock(hasFilter: boolean): string {
  if (!hasFilter) return FINANCIALS_FIELDS.trim();
  let block = FINANCIALS_FIELDS.trim();
  block = withFilterArg(block, 'income', 'filter');
  block = withFilterArg(block, 'balanceSheet', 'filter');
  block = withFilterArg(block, 'cashFlow', 'filter');
  return block;
}

/** Fields that accept the top-level ArrayFilterInput arg directly on Entity. */
const ARRAY_SUBGRAPH_FIELDS = new Set<EnrichmentField>([
  'news',
  'research',
  'social',
  'predictions',
  'discussions',
  'institutionalHoldings',
  'insiderTrades',
  'earningsPressReleases',
  'segmentedRevenue',
  'earnings',
  'periodicFilings',
]);

/** Filtered variants of array sub-graph field blocks (top-level Entity fields only). */
const FILTERED_FIELD_BLOCK_MAP: Partial<Record<EnrichmentField, string>> = {
  news: `news(filter: $filter) {\n    title\n    link\n    snippet\n    source\n    date\n    imageUrl\n    sentimentScore\n  }`,
  research: `research(filter: $filter) {\n    title\n    url\n    publishedDate\n    author\n    text\n    score\n  }`,
  social: `social {\n    reddit(filter: $filter) {\n      id\n      title\n      subreddit\n      author\n      score\n      numComments\n      url\n      text\n      date\n    }\n    redditComments(filter: $filter) {\n      id\n      body\n      author\n      subreddit\n      score\n      date\n      parentId\n      postId\n    }\n  }`,
  predictions: `predictions(filter: $filter) {\n    eventId\n    title\n    url\n    outcomes { name probability }\n    outcomesRemaining\n    priceMovement\n    volume24hr\n    volume1mo\n    liquidity\n    date\n    endDate\n  }`,
  discussions: `discussions(filter: $filter) {\n    objectId\n    title\n    url\n    hnUrl\n    author\n    date\n    points\n    numComments\n    topComments { author text points }\n  }`,
  institutionalHoldings: `institutionalHoldings(filter: $filter) {\n    issuerName\n    cusip\n    titleOfClass\n    value\n    shares\n    sharesOrPrincipal\n    investmentDiscretion\n    reportDate\n    filingDate\n  }`,
  insiderTrades: `insiderTrades(filter: $filter) {\n    accessionNumber\n    filingUrl\n    reporterName\n    reporterCik\n    officerTitle\n    isOfficer\n    isDirector\n    isTenPercentOwner\n    isUnder10b5One\n    securityTitle\n    transactionDate\n    transactionCode\n    acquiredDisposed\n    shares\n    pricePerShare\n    transactionValue\n    sharesOwnedFollowingTransaction\n    ownershipType\n    isDerivative\n    filingDate\n  }`,
  earningsPressReleases: `earningsPressReleases(filter: $filter) {\n    accessionNumber\n    filingDate\n    reportDate\n    items\n    filingUrl\n    pressReleaseUrl\n    body\n    excerpt\n    bodyLength\n    guidance { text metric period direction }\n  }`,
  segmentedRevenue: `segmentedRevenue(filter: $filter) {\n    accessionNumber\n    filingUrl\n    form\n    filingDate\n    reportDate\n    dimension\n    axis\n    member\n    segment\n    value\n    startDate\n    endDate\n    concept\n  }`,
  earnings: `earnings(filter: $filter) {\n    period\n    reportDate\n    quarter\n    year\n    epsActual\n    epsEstimate\n    revenueActual\n    revenueEstimate\n    surprisePercent\n    revenueSurprisePercent\n    hour\n  }`,
  periodicFilings: `periodicFilings(filter: $filter) {\n    accessionNumber\n    form\n    filingDate\n    reportDate\n    filingUrl\n    documentUrl\n    sections {\n      item\n      title\n      body\n      excerpt\n      bodyLength\n    }\n  }`,
};

const TOP_HOLDERS_PAGINATED_BLOCK = `topHolders(limit: $topHoldersLimit, offset: $topHoldersOffset) {
    filerName
    cik
    value
    shares
    reportDate
    filingDate
  }`;

function blockFor(field: EnrichmentField, flags: BuildFlags): string {
  switch (field) {
    case 'market':
      return marketBlock(flags.hasFilter);
    case 'regulatory':
      return regulatoryBlock(flags.hasFilingsFilter);
    case 'risk':
      return riskBlock(flags.hasRiskSignalFilter);
    case 'derivatives':
      return derivativesBlock(flags.hasFuturesFilter, flags.hasOptionsFilter);
    case 'financials':
      return financialsBlock(flags.hasFilter);
    case 'topHolders':
      return flags.hasTopHoldersPagination ? TOP_HOLDERS_PAGINATED_BLOCK : TOP_HOLDERS_FIELDS.trim();
    case 'technicals':
      return TECHNICALS_FIELDS.trim();
    case 'sentiment':
      return SENTIMENT_FIELDS.trim();
    case 'analyst':
      return ANALYST_FIELDS.trim();
    case 'executives':
      return EXECUTIVES_FIELDS.trim();
    case 'ownership':
      return OWNERSHIP_FIELDS.trim();
    default: {
      const filtered = flags.hasFilter && ARRAY_SUBGRAPH_FIELDS.has(field) ? FILTERED_FIELD_BLOCK_MAP[field] : undefined;
      if (filtered) return filtered;
      return DEFAULT_FIELD_BLOCK[field];
    }
  }
}

const DEFAULT_FIELD_BLOCK: Record<EnrichmentField, string> = {
  market: '',
  risk: '',
  regulatory: '',
  technicals: TECHNICALS_FIELDS.trim(),
  derivatives: '',
  news: NEWS_FIELDS.trim(),
  research: RESEARCH_FIELDS.trim(),
  sentiment: SENTIMENT_FIELDS.trim(),
  social: SOCIAL_FIELDS.trim(),
  predictions: PREDICTIONS_FIELDS.trim(),
  discussions: DISCUSSIONS_FIELDS.trim(),
  analyst: ANALYST_FIELDS.trim(),
  financials: '',
  executives: EXECUTIVES_FIELDS.trim(),
  institutionalHoldings: INSTITUTIONAL_HOLDINGS_FIELDS.trim(),
  ownership: OWNERSHIP_FIELDS.trim(),
  topHolders: TOP_HOLDERS_FIELDS.trim(),
  insiderTrades: INSIDER_TRADES_FIELDS.trim(),
  earningsPressReleases: EARNINGS_PRESS_RELEASES_FIELDS.trim(),
  segmentedRevenue: SEGMENTED_REVENUE_FIELDS.trim(),
  earnings: EARNINGS_FIELDS.trim(),
  periodicFilings: PERIODIC_FILINGS_FIELDS.trim(),
};

function buildBlocks(fields: EnrichmentField[], flags: BuildFlags): string {
  return fields.map((f) => `    ${blockFor(f, flags)}`).join('\n');
}

function extraVarDecls(fields: EnrichmentField[], flags: BuildFlags): string {
  let vars = '';
  // Generic ArrayFilterInput is used across many fields — include when any of: top-level array fields, market, financials.
  const genericFilterApplies =
    flags.hasFilter &&
    fields.some((f) => ARRAY_SUBGRAPH_FIELDS.has(f) || f === 'market' || f === 'financials');
  if (genericFilterApplies) vars += ', $filter: ArrayFilterInput';
  if (flags.hasFilingsFilter && fields.includes('regulatory')) vars += ', $filingsFilter: FilingsFilterInput';
  if (flags.hasRiskSignalFilter && fields.includes('risk')) vars += ', $riskSignalFilter: RiskSignalFilterInput';
  if (flags.hasFuturesFilter && fields.includes('derivatives')) vars += ', $futuresFilter: FuturesCurveFilterInput';
  if (flags.hasOptionsFilter && fields.includes('derivatives')) vars += ', $optionsFilter: OptionsChainFilterInput';
  if (flags.hasTopHoldersPagination && fields.includes('topHolders')) vars += ', $topHoldersLimit: Int, $topHoldersOffset: Int';
  return vars;
}

function computeFlags(options?: EnrichOptions | ArraySubGraphOptions): BuildFlags {
  const enriched = isEnrichOptions(options);
  const filter = enriched ? options.filter : options;
  const topHolders = enriched ? options.topHolders : undefined;
  return {
    hasFilter: hasAnyField(filter),
    hasFilingsFilter: enriched ? hasFilingsFilter(options.filingsFilter) : false,
    hasRiskSignalFilter: enriched ? hasRiskSignalFilter(options.riskSignalFilter) : false,
    hasFuturesFilter: enriched ? hasFuturesFilter(options.futuresFilter) : false,
    hasOptionsFilter: enriched ? hasOptionsFilter(options.optionsFilter) : false,
    hasTopHoldersPagination: topHolders != null && (topHolders.limit != null || topHolders.offset != null),
  };
}

export function buildEnrichQuery(fields: EnrichmentField[], options?: EnrichOptions | ArraySubGraphOptions): string {
  const flags = computeFlags(options);
  const vars = extraVarDecls(fields, flags);
  const blocks = buildBlocks(fields, flags);

  return `
  query EnrichEntity($id: ID!${vars}) {
    entity(id: $id) {
      id
      name
      type
      tickers
      domain
      country
${blocks}
    }
  }`;
}

export function buildBatchEnrichQuery(
  fields: EnrichmentField[],
  options?: EnrichOptions | ArraySubGraphOptions,
): string {
  const flags = computeFlags(options);
  const vars = extraVarDecls(fields, flags);
  const blocks = buildBlocks(fields, flags);

  return `
  query BatchEnrich($tickers: [String!]!${vars}) {
    entitiesByTickers(tickers: $tickers) {
      id
      name
      type
      tickers
      domain
      country
${blocks}
    }
  }`;
}

function isEnrichOptions(opts: unknown): opts is EnrichOptions {
  if (!opts || typeof opts !== 'object') return false;
  return (
    'filter' in opts ||
    'filingsFilter' in opts ||
    'riskSignalFilter' in opts ||
    'futuresFilter' in opts ||
    'optionsFilter' in opts ||
    'topHolders' in opts
  );
}
