import {
  extractCommonFlags,
  EXIT,
  type ExitCode,
  usageError,
} from "./common.js";
import { parseArgs } from "./args.js";
import * as cmd from "./commands/index.js";

const ROOT_HELP = `jintel — Jintel intelligence API CLI

Usage:
  jintel <command> [arguments] [flags]

Core commands:
  quote <tickers>                  Latest quotes (batch)
  search <query>                   Search entities
  enrich <ticker>                  Fetch a full enriched entity
  sanctions <name>                 Sanctions screening
  price-history <tickers>          OHLCV candles (batch)
  market-status                    US market session status

Per-entity sub-graphs (one ticker each):
  news <ticker>                    Recent news articles
  research <ticker>                Web research articles
  sentiment <ticker>               Aggregated social sentiment
  social <ticker>                  Raw Reddit / Twitter signals
  discussions <ticker>             Hacker News stories
  predictions <ticker>             Polymarket / Kalshi events
  risk-signals <ticker>            Sanctions, litigation, regulatory, PEP
  regulatory <ticker>              SEC filings + sanctions + campaign finance
  periodic-filings <ticker>        10-K / 10-Q / 8-K filings
  technicals <ticker>              RSI, MACD, BB, EMA, SMA, ATR, ADX, etc.
  derivatives <ticker>             Futures curve + options chain
  ownership <ticker>               Institutional / insider / retail breakdown
  top-holders <ticker>             Top institutional holders
  insider-trades <ticker>          Form 4 transactions
  financials <ticker>              Income / balance sheet / cash flow
  executives <ticker>              Officers + compensation
  earnings-calendar <ticker>       Past + upcoming earnings reports
  earnings-press-releases <ticker> Earnings press releases
  segmented-revenue <ticker>       Revenue by product / segment / geography
  analyst-consensus <ticker>       Wall Street recommendation + targets
  short-interest <ticker>          Short-interest reports
  clinical-trials <ticker>         Clinical trial registrations
  fda-events <ticker>              FDA adverse events + recalls
  litigation <ticker>              Active + historical lawsuits
  government-contracts <ticker>    US government contracts
  query <kind> <ticker>            Compact dispatcher across all of the above

Macro & cross-sectional:
  gdp <country>                    GDP time series
  inflation <country>              CPI / inflation
  interest-rates <country>         Policy rates
  sp500-multiples <series>         S&P 500 PE / CAPE / yields
  macro-series <id[,id,...]>       FRED-style time series (single or batch)
  fama-french <series>             Fama-French factor returns
  campaign-finance <name>          PAC / candidate committee data
  institutional-holdings <cik>     13F holdings by filer CIK

Agent discovery:
  list-tools                       Dump all commands as JSON for agent tool lists

Common flags on every command:
  --api-key <key>    API key (else reads JINTEL_API_KEY or ~/.jintel/config.json)
  --base-url <url>   Override API base URL (else uses https://api.jintel.ai/api)
  --json             Output raw JSON instead of a table (where applicable)
  --help, -h         Show help for the command

Run "jintel <command> --help" for command-specific usage.
`;

const SUBCOMMAND_HELP: Record<string, string> = {
  quote: cmd.QUOTE_HELP,
  search: cmd.SEARCH_HELP,
  enrich: cmd.ENRICH_HELP,
  sanctions: cmd.SANCTIONS_HELP,
  "price-history": cmd.PRICE_HISTORY_HELP,
  "market-status": cmd.MARKET_STATUS_HELP,
  "short-interest": cmd.SHORT_INTEREST_HELP,
  "campaign-finance": cmd.CAMPAIGN_FINANCE_HELP,
  "institutional-holdings": cmd.INSTITUTIONAL_HOLDINGS_HELP,
  "fama-french": cmd.FAMA_FRENCH_HELP,
  news: cmd.NEWS_HELP,
  research: cmd.RESEARCH_HELP,
  sentiment: cmd.SENTIMENT_HELP,
  social: cmd.SOCIAL_HELP,
  discussions: cmd.DISCUSSIONS_HELP,
  predictions: cmd.PREDICTIONS_HELP,
  "risk-signals": cmd.RISK_SIGNALS_HELP,
  regulatory: cmd.REGULATORY_HELP,
  "periodic-filings": cmd.PERIODIC_FILINGS_HELP,
  technicals: cmd.TECHNICALS_HELP,
  derivatives: cmd.DERIVATIVES_HELP,
  ownership: cmd.OWNERSHIP_HELP,
  "top-holders": cmd.TOP_HOLDERS_HELP,
  "insider-trades": cmd.INSIDER_TRADES_HELP,
  financials: cmd.FINANCIALS_HELP,
  executives: cmd.EXECUTIVES_HELP,
  "earnings-calendar": cmd.EARNINGS_CALENDAR_HELP,
  "earnings-press-releases": cmd.EARNINGS_PRESS_RELEASES_HELP,
  "segmented-revenue": cmd.SEGMENTED_REVENUE_HELP,
  "analyst-consensus": cmd.ANALYST_CONSENSUS_HELP,
  "clinical-trials": cmd.CLINICAL_TRIALS_HELP,
  "fda-events": cmd.FDA_EVENTS_HELP,
  litigation: cmd.LITIGATION_HELP,
  "government-contracts": cmd.GOVERNMENT_CONTRACTS_HELP,
  gdp: cmd.GDP_HELP,
  inflation: cmd.INFLATION_HELP,
  "interest-rates": cmd.INTEREST_RATES_HELP,
  "sp500-multiples": cmd.SP500_MULTIPLES_HELP,
  "macro-series": cmd.MACRO_SERIES_HELP,
  query: cmd.QUERY_HELP,
  "list-tools": cmd.LIST_TOOLS_HELP,
};

export async function run(argv: string[]): Promise<ExitCode> {
  const args = parseArgs(argv);
  const opts = extractCommonFlags(args);

  const command = args.positionals[0];

  // Global --help / no-command path.
  if (!command || command === "help") {
    if (opts.help || !command) {
      process.stdout.write(ROOT_HELP);
      return EXIT.OK;
    }
    // `jintel help <cmd>` → show that subcommand's help.
    const target = args.positionals[1];
    if (target && SUBCOMMAND_HELP[target]) {
      process.stdout.write(SUBCOMMAND_HELP[target]);
      return EXIT.OK;
    }
    process.stdout.write(ROOT_HELP);
    return EXIT.OK;
  }

  switch (command) {
    case "quote":
    case "quotes":
      return cmd.runQuote(opts);
    case "search":
      return cmd.runSearch(opts);
    case "enrich":
      return cmd.runEnrich(opts);
    case "sanctions":
      return cmd.runSanctions(opts);
    case "price-history":
      return cmd.runPriceHistory(opts);
    case "market-status":
      return cmd.runMarketStatus(opts);
    case "short-interest":
      return cmd.runShortInterest(opts);
    case "campaign-finance":
      return cmd.runCampaignFinance(opts);
    case "institutional-holdings":
      return cmd.runInstitutionalHoldings(opts);
    case "fama-french":
      return cmd.runFamaFrench(opts);
    case "news":
      return cmd.runNews(opts);
    case "research":
      return cmd.runResearch(opts);
    case "sentiment":
      return cmd.runSentiment(opts);
    case "social":
      return cmd.runSocial(opts);
    case "discussions":
      return cmd.runDiscussions(opts);
    case "predictions":
      return cmd.runPredictions(opts);
    case "risk-signals":
      return cmd.runRiskSignals(opts);
    case "regulatory":
      return cmd.runRegulatory(opts);
    case "periodic-filings":
      return cmd.runPeriodicFilings(opts);
    case "technicals":
      return cmd.runTechnicals(opts);
    case "derivatives":
      return cmd.runDerivatives(opts);
    case "ownership":
      return cmd.runOwnership(opts);
    case "top-holders":
      return cmd.runTopHolders(opts);
    case "insider-trades":
      return cmd.runInsiderTrades(opts);
    case "financials":
      return cmd.runFinancials(opts);
    case "executives":
      return cmd.runExecutives(opts);
    case "earnings-calendar":
      return cmd.runEarningsCalendar(opts);
    case "earnings-press-releases":
      return cmd.runEarningsPressReleases(opts);
    case "segmented-revenue":
      return cmd.runSegmentedRevenue(opts);
    case "analyst-consensus":
      return cmd.runAnalystConsensus(opts);
    case "clinical-trials":
      return cmd.runClinicalTrials(opts);
    case "fda-events":
      return cmd.runFdaEvents(opts);
    case "litigation":
      return cmd.runLitigation(opts);
    case "government-contracts":
      return cmd.runGovernmentContracts(opts);
    case "gdp":
      return cmd.runGdp(opts);
    case "inflation":
      return cmd.runInflation(opts);
    case "interest-rates":
      return cmd.runInterestRates(opts);
    case "sp500-multiples":
      return cmd.runSp500Multiples(opts);
    case "macro-series":
      return cmd.runMacroSeries(opts);
    case "query":
      return cmd.runQuery(opts);
    case "list-tools":
      return cmd.runListTools(opts);
    default:
      if (opts.help) {
        process.stdout.write(ROOT_HELP);
        return EXIT.OK;
      }
      return usageError(
        `unknown command "${command}". Run "jintel --help" for usage.`,
      );
  }
}
