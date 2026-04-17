import { extractCommonFlags, EXIT, type ExitCode, usageError } from './common.js';
import { parseArgs } from './args.js';
import { runQuote, QUOTE_HELP } from './commands/quote.js';
import { runSearch, SEARCH_HELP } from './commands/search.js';
import { runEnrich, ENRICH_HELP } from './commands/enrich.js';
import { runSanctions, SANCTIONS_HELP } from './commands/sanctions.js';
import { runPriceHistory, PRICE_HISTORY_HELP } from './commands/price-history.js';
import { runMarketStatus, MARKET_STATUS_HELP } from './commands/market-status.js';
import { runShortInterest, SHORT_INTEREST_HELP } from './commands/short-interest.js';
import { runCampaignFinance, CAMPAIGN_FINANCE_HELP } from './commands/campaign-finance.js';
import { runInstitutionalHoldings, INSTITUTIONAL_HOLDINGS_HELP } from './commands/institutional-holdings.js';
import { runFamaFrench, FAMA_FRENCH_HELP } from './commands/fama-french.js';

const ROOT_HELP = `jintel — Jintel intelligence API CLI

Usage:
  jintel <command> [arguments] [flags]

Commands:
  quote <tickers>                  Latest quotes (batch)
  search <query>                   Search entities
  enrich <ticker>                  Fetch an enriched entity
  sanctions <name>                 Sanctions screening
  price-history <tickers>          OHLCV candles (batch)
  short-interest <ticker>          Short-interest reports
  campaign-finance <name>          PAC/committee data
  institutional-holdings <cik>     13F institutional holdings by filer CIK
  fama-french <series>             Fama-French factor returns
  market-status                    US market session status

Common flags on every command:
  --api-key <key>    API key (else reads JINTEL_API_KEY or ~/.jintel/config.json)
  --base-url <url>   Override API base URL (else uses https://api.jintel.ai/api)
  --json             Output raw JSON instead of a table
  --help, -h         Show help for the command

Run "jintel <command> --help" for command-specific usage.
`;

const SUBCOMMAND_HELP: Record<string, string> = {
  quote: QUOTE_HELP,
  search: SEARCH_HELP,
  enrich: ENRICH_HELP,
  sanctions: SANCTIONS_HELP,
  'price-history': PRICE_HISTORY_HELP,
  'market-status': MARKET_STATUS_HELP,
  'short-interest': SHORT_INTEREST_HELP,
  'campaign-finance': CAMPAIGN_FINANCE_HELP,
  'institutional-holdings': INSTITUTIONAL_HOLDINGS_HELP,
  'fama-french': FAMA_FRENCH_HELP,
};

export async function run(argv: string[]): Promise<ExitCode> {
  const args = parseArgs(argv);
  const opts = extractCommonFlags(args);

  const command = args.positionals[0];

  // Global --help / no-command path.
  if (!command || command === 'help') {
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
    case 'quote':
    case 'quotes':
      return runQuote(opts);
    case 'search':
      return runSearch(opts);
    case 'enrich':
      return runEnrich(opts);
    case 'sanctions':
      return runSanctions(opts);
    case 'price-history':
      return runPriceHistory(opts);
    case 'market-status':
      return runMarketStatus(opts);
    case 'short-interest':
      return runShortInterest(opts);
    case 'campaign-finance':
      return runCampaignFinance(opts);
    case 'institutional-holdings':
      return runInstitutionalHoldings(opts);
    case 'fama-french':
      return runFamaFrench(opts);
    default:
      if (opts.help) {
        process.stdout.write(ROOT_HELP);
        return EXIT.OK;
      }
      return usageError(`unknown command "${command}". Run "jintel --help" for usage.`);
  }
}
