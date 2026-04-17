import type { ArraySubGraphOptions, EnrichmentField, EnrichOptions, TopHoldersOptions } from './types.js';

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
  query Gdp($country: String!, $type: GdpType) {
    gdp(country: $country, type: $type) {
      date
      country
      value
    }
  }`;

export const INFLATION = `
  query Inflation($country: String!) {
    inflation(country: $country) {
      date
      country
      value
    }
  }`;

export const INTEREST_RATES = `
  query InterestRates($country: String!) {
    interestRates(country: $country) {
      date
      country
      value
    }
  }`;

export const SP500_MULTIPLES = `
  query SP500Multiples($series: SP500Series!) {
    sp500Multiples(series: $series) {
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
  query FamaFrenchFactors($series: FamaFrenchSeries!, $range: String) {
    famaFrenchFactors(series: $series, range: $range) {
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
  query ShortInterest($ticker: String!) {
    shortInterest(ticker: $ticker) {
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

const FIELD_BLOCK_MAP: Record<EnrichmentField, string> = {
  market: `market {\n    ${MARKET_QUOTE_FIELDS.trim()}\n    ${FUNDAMENTALS_FIELDS.trim()}\n    ${HISTORY_FIELDS.trim()}\n    ${KEY_EVENTS_FIELDS.trim()}\n    ${SHORT_INTEREST_FIELDS.trim()}\n  }`,
  risk: RISK_FIELDS.trim(),
  regulatory: REGULATORY_FIELDS.trim(),
  technicals: TECHNICALS_FIELDS.trim(),
  derivatives: DERIVATIVES_FIELDS.trim(),
  news: NEWS_FIELDS.trim(),
  research: RESEARCH_FIELDS.trim(),
  sentiment: SENTIMENT_FIELDS.trim(),
  social: SOCIAL_FIELDS.trim(),
  predictions: PREDICTIONS_FIELDS.trim(),
  discussions: DISCUSSIONS_FIELDS.trim(),
  analyst: ANALYST_FIELDS.trim(),
  financials: FINANCIALS_FIELDS.trim(),
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

/** Fields that accept the ArrayFilterInput arg. */
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

/** Filtered variants of array sub-graph field blocks. */
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

function buildBlocks(fields: EnrichmentField[], hasFilter: boolean, hasTopHoldersPagination: boolean): string {
  return fields
    .filter((f) => f in FIELD_BLOCK_MAP)
    .map((f) => {
      if (f === 'topHolders' && hasTopHoldersPagination) return `    ${TOP_HOLDERS_PAGINATED_BLOCK}`;
      const block = hasFilter && ARRAY_SUBGRAPH_FIELDS.has(f) ? FILTERED_FIELD_BLOCK_MAP[f]! : FIELD_BLOCK_MAP[f];
      return `    ${block}`;
    })
    .join('\n');
}

function extraVarDecls(fields: EnrichmentField[], hasFilter: boolean, hasTopHoldersPagination: boolean): string {
  let vars = '';
  if (hasFilter && fields.some((f) => ARRAY_SUBGRAPH_FIELDS.has(f))) {
    vars += ', $filter: ArrayFilterInput';
  }
  if (hasTopHoldersPagination && fields.includes('topHolders')) {
    vars += ', $topHoldersLimit: Int, $topHoldersOffset: Int';
  }
  return vars;
}

export function buildEnrichQuery(fields: EnrichmentField[], options?: EnrichOptions | ArraySubGraphOptions): string {
  const filter = isEnrichOptions(options) ? options.filter : options;
  const topHolders = isEnrichOptions(options) ? options.topHolders : undefined;
  const hasFilter =
    filter != null && (filter.since != null || filter.until != null || filter.limit != null || filter.sort != null);
  const hasTopHoldersPagination = topHolders != null && (topHolders.limit != null || topHolders.offset != null);
  const vars = extraVarDecls(fields, hasFilter, hasTopHoldersPagination);
  const blocks = buildBlocks(fields, hasFilter, hasTopHoldersPagination);

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
  const filter = isEnrichOptions(options) ? options.filter : options;
  const topHolders = isEnrichOptions(options) ? options.topHolders : undefined;
  const hasFilter =
    filter != null && (filter.since != null || filter.until != null || filter.limit != null || filter.sort != null);
  const hasTopHoldersPagination = topHolders != null && (topHolders.limit != null || topHolders.offset != null);
  const vars = extraVarDecls(fields, hasFilter, hasTopHoldersPagination);
  const blocks = buildBlocks(fields, hasFilter, hasTopHoldersPagination);

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
  return 'filter' in opts || 'topHolders' in opts;
}
