// Barrel for command HELP strings + runners. Used by cli.ts (router) and
// list-tools.ts (agent-discovery dump). Adding a new command? Append it here
// AND in cli.ts SUBCOMMAND_HELP / switch.

export { runQuote, QUOTE_HELP } from "./quote.js";
export { runSearch, SEARCH_HELP } from "./search.js";
export { runEnrich, ENRICH_HELP } from "./enrich.js";
export { runSanctions, SANCTIONS_HELP } from "./sanctions.js";
export { runPriceHistory, PRICE_HISTORY_HELP } from "./price-history.js";
export { runMarketStatus, MARKET_STATUS_HELP } from "./market-status.js";
export { runShortInterest, SHORT_INTEREST_HELP } from "./short-interest.js";
export {
  runCampaignFinance,
  CAMPAIGN_FINANCE_HELP,
} from "./campaign-finance.js";
export {
  runInstitutionalHoldings,
  INSTITUTIONAL_HOLDINGS_HELP,
} from "./institutional-holdings.js";
export { runFamaFrench, FAMA_FRENCH_HELP } from "./fama-french.js";

export { runNews, NEWS_HELP } from "./news.js";
export { runResearch, RESEARCH_HELP } from "./research.js";
export { runSentiment, SENTIMENT_HELP } from "./sentiment.js";
export { runSocial, SOCIAL_HELP } from "./social.js";
export { runDiscussions, DISCUSSIONS_HELP } from "./discussions.js";
export { runPredictions, PREDICTIONS_HELP } from "./predictions.js";
export { runRiskSignals, RISK_SIGNALS_HELP } from "./risk-signals.js";
export { runRegulatory, REGULATORY_HELP } from "./regulatory.js";
export {
  runPeriodicFilings,
  PERIODIC_FILINGS_HELP,
} from "./periodic-filings.js";
export { runTechnicals, TECHNICALS_HELP } from "./technicals.js";
export { runDerivatives, DERIVATIVES_HELP } from "./derivatives.js";
export { runOwnership, OWNERSHIP_HELP } from "./ownership.js";
export { runTopHolders, TOP_HOLDERS_HELP } from "./top-holders.js";
export { runInsiderTrades, INSIDER_TRADES_HELP } from "./insider-trades.js";
export { runFinancials, FINANCIALS_HELP } from "./financials.js";
export { runExecutives, EXECUTIVES_HELP } from "./executives.js";
export {
  runEarningsCalendar,
  EARNINGS_CALENDAR_HELP,
} from "./earnings-calendar.js";
export {
  runEarningsPressReleases,
  EARNINGS_PRESS_RELEASES_HELP,
} from "./earnings-press-releases.js";
export {
  runSegmentedRevenue,
  SEGMENTED_REVENUE_HELP,
} from "./segmented-revenue.js";
export {
  runAnalystConsensus,
  ANALYST_CONSENSUS_HELP,
} from "./analyst-consensus.js";
export { runClinicalTrials, CLINICAL_TRIALS_HELP } from "./clinical-trials.js";
export { runFdaEvents, FDA_EVENTS_HELP } from "./fda-events.js";
export { runLitigation, LITIGATION_HELP } from "./litigation.js";
export {
  runGovernmentContracts,
  GOVERNMENT_CONTRACTS_HELP,
} from "./government-contracts.js";
export { runGdp, GDP_HELP } from "./gdp.js";
export { runInflation, INFLATION_HELP } from "./inflation.js";
export { runInterestRates, INTEREST_RATES_HELP } from "./interest-rates.js";
export { runSp500Multiples, SP500_MULTIPLES_HELP } from "./sp500-multiples.js";
export { runMacroSeries, MACRO_SERIES_HELP } from "./macro-series.js";
export { runQuery, QUERY_HELP } from "./query.js";
export { runListTools, LIST_TOOLS_HELP } from "./list-tools.js";
