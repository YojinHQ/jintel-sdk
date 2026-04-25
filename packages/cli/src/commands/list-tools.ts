import { EXIT, type CommandOptions, type ExitCode } from "../common.js";
import { printJson } from "../format.js";

interface ToolDescriptor {
  name: string;
  description: string;
  /** First line of `jintel <name> --help`. */
  usage: string;
}

/**
 * Pull a one-line description out of a HELP string by stripping the leading
 * "Usage:" line and returning the first non-empty paragraph (joined to a
 * single line). Agent-friendly: short and grep-able.
 */
function extractDescription(help: string): string {
  const lines = help.split("\n").map((l) => l.trim());
  const first = lines.findIndex((l) => l.startsWith("Usage:"));
  const after = first >= 0 ? lines.slice(first + 1) : lines;
  const para: string[] = [];
  let inPara = false;
  for (const line of after) {
    if (line === "") {
      if (inPara) break;
      continue;
    }
    if (
      line.startsWith("Flags:") ||
      line.startsWith("Series:") ||
      line.startsWith("Kinds:")
    )
      break;
    inPara = true;
    para.push(line);
  }
  return para.join(" ");
}

function extractUsage(help: string): string {
  const lines = help.split("\n");
  const usageLine = lines.find((l) => l.startsWith("Usage:"));
  return usageLine?.replace(/^Usage:\s*/, "").trim() ?? "";
}

export const LIST_TOOLS_HELP = `Usage: jintel list-tools [flags]

Print every available command with a one-line description, as JSON. Designed
for agent discovery — pipe into a tool to feed an agent's tool list.

Flags:
  --help    Show this message
`;

/**
 * Build the descriptor list. Imported lazily inside the runner so we don't pay
 * the import cost when the user runs another command.
 */
async function buildDescriptors(): Promise<ToolDescriptor[]> {
  const c = await import("./index.js");
  const entries: Array<[string, string]> = [
    ["quote", c.QUOTE_HELP],
    ["search", c.SEARCH_HELP],
    ["enrich", c.ENRICH_HELP],
    ["sanctions", c.SANCTIONS_HELP],
    ["price-history", c.PRICE_HISTORY_HELP],
    ["market-status", c.MARKET_STATUS_HELP],
    ["short-interest", c.SHORT_INTEREST_HELP],
    ["campaign-finance", c.CAMPAIGN_FINANCE_HELP],
    ["institutional-holdings", c.INSTITUTIONAL_HOLDINGS_HELP],
    ["fama-french", c.FAMA_FRENCH_HELP],
    ["news", c.NEWS_HELP],
    ["research", c.RESEARCH_HELP],
    ["sentiment", c.SENTIMENT_HELP],
    ["social", c.SOCIAL_HELP],
    ["discussions", c.DISCUSSIONS_HELP],
    ["predictions", c.PREDICTIONS_HELP],
    ["risk-signals", c.RISK_SIGNALS_HELP],
    ["regulatory", c.REGULATORY_HELP],
    ["periodic-filings", c.PERIODIC_FILINGS_HELP],
    ["technicals", c.TECHNICALS_HELP],
    ["derivatives", c.DERIVATIVES_HELP],
    ["ownership", c.OWNERSHIP_HELP],
    ["top-holders", c.TOP_HOLDERS_HELP],
    ["insider-trades", c.INSIDER_TRADES_HELP],
    ["financials", c.FINANCIALS_HELP],
    ["executives", c.EXECUTIVES_HELP],
    ["earnings-calendar", c.EARNINGS_CALENDAR_HELP],
    ["earnings-press-releases", c.EARNINGS_PRESS_RELEASES_HELP],
    ["segmented-revenue", c.SEGMENTED_REVENUE_HELP],
    ["analyst-consensus", c.ANALYST_CONSENSUS_HELP],
    ["clinical-trials", c.CLINICAL_TRIALS_HELP],
    ["fda-events", c.FDA_EVENTS_HELP],
    ["litigation", c.LITIGATION_HELP],
    ["government-contracts", c.GOVERNMENT_CONTRACTS_HELP],
    ["gdp", c.GDP_HELP],
    ["inflation", c.INFLATION_HELP],
    ["interest-rates", c.INTEREST_RATES_HELP],
    ["sp500-multiples", c.SP500_MULTIPLES_HELP],
    ["macro-series", c.MACRO_SERIES_HELP],
    ["query", c.QUERY_HELP],
  ];
  return entries.map(([name, help]) => ({
    name,
    usage: extractUsage(help),
    description: extractDescription(help),
  }));
}

export async function runListTools(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(LIST_TOOLS_HELP);
    return EXIT.OK;
  }
  const descriptors = await buildDescriptors();
  printJson(descriptors);
  return EXIT.OK;
}
