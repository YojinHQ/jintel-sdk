import type {
  ArraySubGraphOptions,
  CampaignFinanceFilterOptions,
  ClinicalTrialFilterOptions,
  DiscussionsFilterOptions,
  EarningsFilterOptions,
  EnrichmentField,
  EnrichOptions,
  ExecutivesFilterOptions,
  FdaEventFilterOptions,
  FilingsFilterOptions,
  FinancialStatementFilterOptions,
  FuturesCurveFilterOptions,
  GovernmentContractFilterOptions,
  InsiderTradeFilterOptions,
  InstitutionalHoldingsFilterOptions,
  LitigationFilterOptions,
  NewsFilterOptions,
  OptionsChainFilterOptions,
  PredictionMarketFilterOptions,
  RiskSignalFilterOptions,
  SanctionsFilterOptions,
  SegmentRevenueFilterOptions,
  TopHoldersFilterOptions,
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

export const CLINICAL_TRIALS_FIELDS = `
  clinicalTrials {
    nctId
    title
    phase
    status
    conditions
    interventions
    sponsor
    startDate
    completionDate
    enrollment
  }`;

export const FDA_EVENTS_FIELDS = `
  fdaEvents {
    id
    type
    reportDate
    severity
    summary
    product
  }`;

export const LITIGATION_FIELDS = `
  litigation {
    id
    caseName
    court
    dateFiled
    dateTerminated
    docketNumber
    natureOfSuit
    absoluteUrl
  }`;

export const GOVERNMENT_CONTRACTS_FIELDS = `
  governmentContracts {
    awardId
    recipient
    actionDate
    amount
    agency
    awardType
    description
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
  query SanctionsScreen($name: String!, $country: String, $filter: SanctionsFilterInput) {
    sanctionsScreen(name: $name, country: $country, filter: $filter) {
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
  query CampaignFinance($name: String!, $cycle: Int, $filter: CampaignFinanceFilterInput) {
    campaignFinance(name: $name, cycle: $cycle, filter: $filter) {
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
  query InstitutionalHoldings($cik: String!, $filter: InstitutionalHoldingsFilterInput) {
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

export const FRED = `
  query Fred($seriesId: String!, $filter: ArrayFilterInput) {
    fred(seriesId: $seriesId) {
      id
      title
      units
      frequency
      lastUpdated
      observations(filter: $filter) {
        date
        value
      }
    }
  }`;

export const FRED_BATCH = `
  query FredBatch($seriesIds: [String!]!, $filter: ArrayFilterInput) {
    fredBatch(seriesIds: $seriesIds) {
      id
      title
      units
      frequency
      lastUpdated
      observations(filter: $filter) {
        date
        value
      }
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

function hasNewsFilter(f: NewsFilterOptions | undefined): boolean {
  if (!f) return false;
  if (hasAnyField(f)) return true;
  if (Array.isArray(f.sources) && f.sources.length > 0) return true;
  return f.minSentiment != null || f.maxSentiment != null;
}

function hasExecutivesFilter(f: ExecutivesFilterOptions | undefined): boolean {
  if (!f) return false;
  return f.minPay != null || f.limit != null || f.sortBy != null;
}

function hasInsiderTradesFilter(f: InsiderTradeFilterOptions | undefined): boolean {
  if (!f) return false;
  if (hasAnyField(f)) return true;
  if (Array.isArray(f.transactionCodes) && f.transactionCodes.length > 0) return true;
  return (
    f.isOfficer != null ||
    f.isDirector != null ||
    f.isTenPercentOwner != null ||
    f.onlyUnder10b5One != null ||
    f.acquiredDisposed != null ||
    f.minValue != null
  );
}

function hasEarningsFilter(f: EarningsFilterOptions | undefined): boolean {
  if (!f) return false;
  if (hasAnyField(f)) return true;
  return (
    f.onlyReported != null ||
    f.onlyUpcoming != null ||
    f.minSurprisePercent != null ||
    f.year != null
  );
}

function hasSegmentRevenueFilter(f: SegmentRevenueFilterOptions | undefined): boolean {
  if (!f) return false;
  if (hasAnyField(f)) return true;
  if (Array.isArray(f.dimensions) && f.dimensions.length > 0) return true;
  return f.minValue != null;
}

function hasTopHoldersFilter(f: TopHoldersFilterOptions | undefined): boolean {
  if (!f) return false;
  if (hasAnyField(f)) return true;
  return f.minValue != null || f.offset != null;
}

function hasInstitutionalHoldingsFilter(f: InstitutionalHoldingsFilterOptions | undefined): boolean {
  if (!f) return false;
  if (hasAnyField(f)) return true;
  return f.minValue != null || f.cusip != null || f.offset != null;
}

function hasPredictionsFilter(f: PredictionMarketFilterOptions | undefined): boolean {
  if (!f) return false;
  if (hasAnyField(f)) return true;
  return (
    f.minVolume24hr != null ||
    f.minLiquidity != null ||
    f.onlyOpen != null ||
    f.offset != null
  );
}

function hasDiscussionsFilter(f: DiscussionsFilterOptions | undefined): boolean {
  if (!f) return false;
  if (hasAnyField(f)) return true;
  return f.minPoints != null || f.minComments != null || f.offset != null;
}

function hasFinancialStatementsFilter(f: FinancialStatementFilterOptions | undefined): boolean {
  if (!f) return false;
  if (hasAnyField(f)) return true;
  return Array.isArray(f.periodTypes) && f.periodTypes.length > 0;
}

function hasSanctionsFilter(f: SanctionsFilterOptions | undefined): boolean {
  if (!f) return false;
  if (f.minScore != null || f.limit != null || f.sort != null) return true;
  if (Array.isArray(f.listNames) && f.listNames.length > 0) return true;
  return Array.isArray(f.programs) && f.programs.length > 0;
}

function hasCampaignFinanceFilter(f: CampaignFinanceFilterOptions | undefined): boolean {
  if (!f) return false;
  return (
    f.cycle != null ||
    f.party != null ||
    f.state != null ||
    f.committeeType != null ||
    f.minRaised != null ||
    f.limit != null ||
    f.sort != null
  );
}

function hasClinicalTrialsFilter(f: ClinicalTrialFilterOptions | undefined): boolean {
  if (!f) return false;
  if (hasAnyField(f)) return true;
  return f.phase != null || f.status != null || f.offset != null;
}

function hasFdaEventsFilter(f: FdaEventFilterOptions | undefined): boolean {
  if (!f) return false;
  if (hasAnyField(f)) return true;
  if (Array.isArray(f.types) && f.types.length > 0) return true;
  return f.severity != null || f.offset != null;
}

function hasLitigationFilter(f: LitigationFilterOptions | undefined): boolean {
  if (!f) return false;
  if (hasAnyField(f)) return true;
  return (
    f.onlyActive != null ||
    f.court != null ||
    f.natureOfSuit != null ||
    f.offset != null
  );
}

function hasGovernmentContractsFilter(f: GovernmentContractFilterOptions | undefined): boolean {
  if (!f) return false;
  if (hasAnyField(f)) return true;
  return f.minAmount != null || f.offset != null;
}

interface BuildFlags {
  hasFilter: boolean;
  hasFilingsFilter: boolean;
  hasRiskSignalFilter: boolean;
  hasFuturesFilter: boolean;
  hasOptionsFilter: boolean;
  hasNewsFilter: boolean;
  hasExecutivesFilter: boolean;
  hasInsiderTradesFilter: boolean;
  hasEarningsFilter: boolean;
  hasSegmentRevenueFilter: boolean;
  hasTopHoldersFilter: boolean;
  hasInstitutionalHoldingsFilter: boolean;
  hasPredictionsFilter: boolean;
  hasDiscussionsFilter: boolean;
  hasFinancialStatementsFilter: boolean;
  hasSanctionsFilter: boolean;
  hasCampaignFinanceFilter: boolean;
  hasClinicalTrialsFilter: boolean;
  hasFdaEventsFilter: boolean;
  hasLitigationFilter: boolean;
  hasGovernmentContractsFilter: boolean;
}

/** Inline `(filter: $varName)` onto a nested field inside an aggregate block. */
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

/** regulatory sub-graph — filings/sanctions/campaignFinance each accept their own filter input. */
function regulatoryBlock(flags: BuildFlags): string {
  let block = REGULATORY_FIELDS.trim();
  if (flags.hasFilingsFilter) block = withFilterArg(block, 'filings', 'filingsFilter');
  if (flags.hasSanctionsFilter) block = withFilterArg(block, 'sanctions', 'sanctionsFilter');
  if (flags.hasCampaignFinanceFilter) block = withFilterArg(block, 'campaignFinance', 'campaignFinanceFilter');
  return block;
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

/** financials sub-graph — income / balanceSheet / cashFlow take FinancialStatementFilterInput. */
function financialsBlock(hasStatementsFilter: boolean): string {
  if (!hasStatementsFilter) return FINANCIALS_FIELDS.trim();
  let block = FINANCIALS_FIELDS.trim();
  block = withFilterArg(block, 'income', 'financialStatementsFilter');
  block = withFilterArg(block, 'balanceSheet', 'financialStatementsFilter');
  block = withFilterArg(block, 'cashFlow', 'financialStatementsFilter');
  return block;
}

/** Fields that accept the top-level ArrayFilterInput arg directly on Entity. */
const ARRAY_SUBGRAPH_FIELDS = new Set<EnrichmentField>([
  'research',
  'social',
  'earningsPressReleases',
  'periodicFilings',
]);

/** Filtered variants of array sub-graph field blocks (top-level Entity fields only). */
const FILTERED_FIELD_BLOCK_MAP: Partial<Record<EnrichmentField, string>> = {
  research: `research(filter: $filter) {\n    title\n    url\n    publishedDate\n    author\n    text\n    score\n  }`,
  social: `social {\n    reddit(filter: $filter) {\n      id\n      title\n      subreddit\n      author\n      score\n      numComments\n      url\n      text\n      date\n      isLinkPost\n      linkDomain\n    }\n    redditComments(filter: $filter) {\n      id\n      body\n      author\n      subreddit\n      score\n      date\n      parentId\n      postId\n    }\n  }`,
  earningsPressReleases: `earningsPressReleases(filter: $filter) {\n    accessionNumber\n    filingDate\n    reportDate\n    items\n    filingUrl\n    pressReleaseUrl\n    body\n    excerpt\n    bodyLength\n    guidance { text metric period direction }\n  }`,
  periodicFilings: `periodicFilings(filter: $filter) {\n    accessionNumber\n    form\n    filingDate\n    reportDate\n    filingUrl\n    documentUrl\n    sections {\n      item\n      title\n      body\n      excerpt\n      bodyLength\n    }\n  }`,
};

function filteredBlock(fieldName: string, varName: string, body: string): string {
  return `${fieldName}(filter: $${varName}) {\n    ${body}\n  }`;
}

const NEWS_INNER = NEWS_FIELDS.trim().replace(/^news\s*\{\s*|\s*\}$/g, '').trim();
const EXECUTIVES_INNER = EXECUTIVES_FIELDS.trim().replace(/^executives\s*\{\s*|\s*\}$/g, '').trim();
const INSIDER_TRADES_INNER = INSIDER_TRADES_FIELDS.trim().replace(/^insiderTrades\s*\{\s*|\s*\}$/g, '').trim();
const EARNINGS_INNER = EARNINGS_FIELDS.trim().replace(/^earnings\s*\{\s*|\s*\}$/g, '').trim();
const SEGMENTED_REVENUE_INNER = SEGMENTED_REVENUE_FIELDS.trim().replace(/^segmentedRevenue\s*\{\s*|\s*\}$/g, '').trim();
const TOP_HOLDERS_INNER = TOP_HOLDERS_FIELDS.trim().replace(/^topHolders\s*\{\s*|\s*\}$/g, '').trim();
const INSTITUTIONAL_HOLDINGS_INNER = INSTITUTIONAL_HOLDINGS_FIELDS.trim()
  .replace(/^institutionalHoldings\s*\{\s*|\s*\}$/g, '')
  .trim();
const PREDICTIONS_INNER = PREDICTIONS_FIELDS.trim().replace(/^predictions\s*\{\s*|\s*\}$/g, '').trim();
const DISCUSSIONS_INNER = DISCUSSIONS_FIELDS.trim().replace(/^discussions\s*\{\s*|\s*\}$/g, '').trim();
const CLINICAL_TRIALS_INNER = CLINICAL_TRIALS_FIELDS.trim().replace(/^clinicalTrials\s*\{\s*|\s*\}$/g, '').trim();
const FDA_EVENTS_INNER = FDA_EVENTS_FIELDS.trim().replace(/^fdaEvents\s*\{\s*|\s*\}$/g, '').trim();
const LITIGATION_INNER = LITIGATION_FIELDS.trim().replace(/^litigation\s*\{\s*|\s*\}$/g, '').trim();
const GOVERNMENT_CONTRACTS_INNER = GOVERNMENT_CONTRACTS_FIELDS.trim().replace(/^governmentContracts\s*\{\s*|\s*\}$/g, '').trim();

function blockFor(field: EnrichmentField, flags: BuildFlags): string {
  switch (field) {
    case 'market':
      return marketBlock(flags.hasFilter);
    case 'regulatory':
      return regulatoryBlock(flags);
    case 'risk':
      return riskBlock(flags.hasRiskSignalFilter);
    case 'derivatives':
      return derivativesBlock(flags.hasFuturesFilter, flags.hasOptionsFilter);
    case 'financials':
      return financialsBlock(flags.hasFinancialStatementsFilter);
    case 'news':
      return flags.hasNewsFilter ? filteredBlock('news', 'newsFilter', NEWS_INNER) : NEWS_FIELDS.trim();
    case 'executives':
      return flags.hasExecutivesFilter
        ? filteredBlock('executives', 'executivesFilter', EXECUTIVES_INNER)
        : EXECUTIVES_FIELDS.trim();
    case 'insiderTrades':
      return flags.hasInsiderTradesFilter
        ? filteredBlock('insiderTrades', 'insiderTradesFilter', INSIDER_TRADES_INNER)
        : INSIDER_TRADES_FIELDS.trim();
    case 'earnings':
      return flags.hasEarningsFilter
        ? filteredBlock('earnings', 'earningsFilter', EARNINGS_INNER)
        : EARNINGS_FIELDS.trim();
    case 'segmentedRevenue':
      return flags.hasSegmentRevenueFilter
        ? filteredBlock('segmentedRevenue', 'segmentedRevenueFilter', SEGMENTED_REVENUE_INNER)
        : SEGMENTED_REVENUE_FIELDS.trim();
    case 'topHolders':
      return flags.hasTopHoldersFilter
        ? filteredBlock('topHolders', 'topHoldersFilter', TOP_HOLDERS_INNER)
        : TOP_HOLDERS_FIELDS.trim();
    case 'institutionalHoldings':
      return flags.hasInstitutionalHoldingsFilter
        ? filteredBlock('institutionalHoldings', 'institutionalHoldingsFilter', INSTITUTIONAL_HOLDINGS_INNER)
        : INSTITUTIONAL_HOLDINGS_FIELDS.trim();
    case 'predictions':
      return flags.hasPredictionsFilter
        ? filteredBlock('predictions', 'predictionsFilter', PREDICTIONS_INNER)
        : PREDICTIONS_FIELDS.trim();
    case 'discussions':
      return flags.hasDiscussionsFilter
        ? filteredBlock('discussions', 'discussionsFilter', DISCUSSIONS_INNER)
        : DISCUSSIONS_FIELDS.trim();
    case 'clinicalTrials':
      return flags.hasClinicalTrialsFilter
        ? filteredBlock('clinicalTrials', 'clinicalTrialsFilter', CLINICAL_TRIALS_INNER)
        : CLINICAL_TRIALS_FIELDS.trim();
    case 'fdaEvents':
      return flags.hasFdaEventsFilter
        ? filteredBlock('fdaEvents', 'fdaEventsFilter', FDA_EVENTS_INNER)
        : FDA_EVENTS_FIELDS.trim();
    case 'litigation':
      return flags.hasLitigationFilter
        ? filteredBlock('litigation', 'litigationFilter', LITIGATION_INNER)
        : LITIGATION_FIELDS.trim();
    case 'governmentContracts':
      return flags.hasGovernmentContractsFilter
        ? filteredBlock('governmentContracts', 'governmentContractsFilter', GOVERNMENT_CONTRACTS_INNER)
        : GOVERNMENT_CONTRACTS_FIELDS.trim();
    case 'technicals':
      return TECHNICALS_FIELDS.trim();
    case 'sentiment':
      return SENTIMENT_FIELDS.trim();
    case 'analyst':
      return ANALYST_FIELDS.trim();
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
  clinicalTrials: CLINICAL_TRIALS_FIELDS.trim(),
  fdaEvents: FDA_EVENTS_FIELDS.trim(),
  litigation: LITIGATION_FIELDS.trim(),
  governmentContracts: GOVERNMENT_CONTRACTS_FIELDS.trim(),
};

function buildBlocks(fields: EnrichmentField[], flags: BuildFlags): string {
  return fields.map((f) => `    ${blockFor(f, flags)}`).join('\n');
}

function extraVarDecls(fields: EnrichmentField[], flags: BuildFlags): string {
  let vars = '';
  // Generic ArrayFilterInput applies to top-level array sub-graphs (research, predictions,
  // discussions, social, institutionalHoldings, earningsPressReleases, periodicFilings)
  // plus market.history/keyEvents/shortInterest.
  const genericFilterApplies =
    flags.hasFilter && fields.some((f) => ARRAY_SUBGRAPH_FIELDS.has(f) || f === 'market');
  if (genericFilterApplies) vars += ', $filter: ArrayFilterInput';
  if (flags.hasFilingsFilter && fields.includes('regulatory')) vars += ', $filingsFilter: FilingsFilterInput';
  if (flags.hasSanctionsFilter && fields.includes('regulatory')) vars += ', $sanctionsFilter: SanctionsFilterInput';
  if (flags.hasCampaignFinanceFilter && fields.includes('regulatory')) vars += ', $campaignFinanceFilter: CampaignFinanceFilterInput';
  if (flags.hasRiskSignalFilter && fields.includes('risk')) vars += ', $riskSignalFilter: RiskSignalFilterInput';
  if (flags.hasFuturesFilter && fields.includes('derivatives')) vars += ', $futuresFilter: FuturesCurveFilterInput';
  if (flags.hasOptionsFilter && fields.includes('derivatives')) vars += ', $optionsFilter: OptionsChainFilterInput';
  if (flags.hasNewsFilter && fields.includes('news')) vars += ', $newsFilter: NewsFilterInput';
  if (flags.hasExecutivesFilter && fields.includes('executives')) vars += ', $executivesFilter: ExecutivesFilterInput';
  if (flags.hasInsiderTradesFilter && fields.includes('insiderTrades')) vars += ', $insiderTradesFilter: InsiderTradeFilterInput';
  if (flags.hasEarningsFilter && fields.includes('earnings')) vars += ', $earningsFilter: EarningsFilterInput';
  if (flags.hasSegmentRevenueFilter && fields.includes('segmentedRevenue'))
    vars += ', $segmentedRevenueFilter: SegmentRevenueFilterInput';
  if (flags.hasTopHoldersFilter && fields.includes('topHolders'))
    vars += ', $topHoldersFilter: TopHoldersFilterInput';
  if (flags.hasInstitutionalHoldingsFilter && fields.includes('institutionalHoldings'))
    vars += ', $institutionalHoldingsFilter: InstitutionalHoldingsFilterInput';
  if (flags.hasPredictionsFilter && fields.includes('predictions'))
    vars += ', $predictionsFilter: PredictionMarketFilterInput';
  if (flags.hasDiscussionsFilter && fields.includes('discussions'))
    vars += ', $discussionsFilter: DiscussionsFilterInput';
  if (flags.hasFinancialStatementsFilter && fields.includes('financials'))
    vars += ', $financialStatementsFilter: FinancialStatementFilterInput';
  if (flags.hasClinicalTrialsFilter && fields.includes('clinicalTrials'))
    vars += ', $clinicalTrialsFilter: ClinicalTrialFilterInput';
  if (flags.hasFdaEventsFilter && fields.includes('fdaEvents'))
    vars += ', $fdaEventsFilter: FdaEventFilterInput';
  if (flags.hasLitigationFilter && fields.includes('litigation'))
    vars += ', $litigationFilter: LitigationFilterInput';
  if (flags.hasGovernmentContractsFilter && fields.includes('governmentContracts'))
    vars += ', $governmentContractsFilter: GovernmentContractFilterInput';
  return vars;
}

function computeFlags(options?: EnrichOptions | ArraySubGraphOptions): BuildFlags {
  const enriched = isEnrichOptions(options);
  const filter = enriched ? options.filter : options;
  return {
    hasFilter: hasAnyField(filter),
    hasFilingsFilter: enriched ? hasFilingsFilter(options.filingsFilter) : false,
    hasRiskSignalFilter: enriched ? hasRiskSignalFilter(options.riskSignalFilter) : false,
    hasFuturesFilter: enriched ? hasFuturesFilter(options.futuresFilter) : false,
    hasOptionsFilter: enriched ? hasOptionsFilter(options.optionsFilter) : false,
    hasNewsFilter: enriched ? hasNewsFilter(options.newsFilter) : false,
    hasExecutivesFilter: enriched ? hasExecutivesFilter(options.executivesFilter) : false,
    hasInsiderTradesFilter: enriched ? hasInsiderTradesFilter(options.insiderTradesFilter) : false,
    hasEarningsFilter: enriched ? hasEarningsFilter(options.earningsFilter) : false,
    hasSegmentRevenueFilter: enriched ? hasSegmentRevenueFilter(options.segmentedRevenueFilter) : false,
    hasTopHoldersFilter: enriched ? hasTopHoldersFilter(options.topHoldersFilter) : false,
    hasInstitutionalHoldingsFilter: enriched
      ? hasInstitutionalHoldingsFilter(options.institutionalHoldingsFilter)
      : false,
    hasPredictionsFilter: enriched ? hasPredictionsFilter(options.predictionsFilter) : false,
    hasDiscussionsFilter: enriched ? hasDiscussionsFilter(options.discussionsFilter) : false,
    hasFinancialStatementsFilter: enriched ? hasFinancialStatementsFilter(options.financialStatementsFilter) : false,
    hasSanctionsFilter: enriched ? hasSanctionsFilter(options.sanctionsFilter) : false,
    hasCampaignFinanceFilter: enriched ? hasCampaignFinanceFilter(options.campaignFinanceFilter) : false,
    hasClinicalTrialsFilter: enriched ? hasClinicalTrialsFilter(options.clinicalTrialsFilter) : false,
    hasFdaEventsFilter: enriched ? hasFdaEventsFilter(options.fdaEventsFilter) : false,
    hasLitigationFilter: enriched ? hasLitigationFilter(options.litigationFilter) : false,
    hasGovernmentContractsFilter: enriched
      ? hasGovernmentContractsFilter(options.governmentContractsFilter)
      : false,
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

const ENRICH_OPTION_KEYS: Array<keyof EnrichOptions> = [
  'filter',
  'filingsFilter',
  'riskSignalFilter',
  'futuresFilter',
  'optionsFilter',
  'newsFilter',
  'executivesFilter',
  'insiderTradesFilter',
  'earningsFilter',
  'segmentedRevenueFilter',
  'topHoldersFilter',
  'institutionalHoldingsFilter',
  'predictionsFilter',
  'discussionsFilter',
  'financialStatementsFilter',
  'sanctionsFilter',
  'campaignFinanceFilter',
  'clinicalTrialsFilter',
  'fdaEventsFilter',
  'litigationFilter',
  'governmentContractsFilter',
];

function isEnrichOptions(opts: unknown): opts is EnrichOptions {
  if (!opts || typeof opts !== 'object') return false;
  return ENRICH_OPTION_KEYS.some((k) => k in opts);
}
