import type {
  ArraySubGraphOptions,
  EnrichOptions,
} from "@yojinhq/jintel-client";
import { getNumber, getString } from "../args.js";
import {
  EXIT,
  parseSort,
  type CommandOptions,
  type ExitCode,
  runSubGraphCommand,
  usageError,
} from "../common.js";

const KINDS = [
  "market",
  "fundamentals",
  "news",
  "research",
  "sentiment",
  "social",
  "discussions",
  "predictions",
  "technicals",
  "derivatives",
  "risk",
  "regulatory",
  "periodic_filings",
  "ownership",
  "top_holders",
  "institutional_holdings",
  "insider_trades",
  "financials",
  "executives",
  "earnings_press_releases",
  "segmented_revenue",
  "earnings_calendar",
  "analyst_consensus",
  "clinical_trials",
  "fda_events",
  "litigation",
  "government_contracts",
] as const;

type Kind = (typeof KINDS)[number];

export const QUERY_HELP = `Usage: jintel query <kind> <ticker> [flags]

Compact dispatcher — single command that fetches any per-entity sub-graph by
kind. Use when you want to keep your shell aliases short. For richer filters
(types, severities, etc) prefer the dedicated command. This aggregator only
supports --since / --until / --limit / --sort.

Kinds:
  ${KINDS.join(", ")}

Flags:
  --since <iso>      Only items on/after this ISO 8601 timestamp
  --until <iso>      Only items on/before this ISO 8601 timestamp
  --limit <n>        Cap result count
  --sort <ASC|DESC>  Sort by date (default DESC)
  --api-key <key>    Override API key
  --base-url <url>   Override API base URL
  --help             Show this message
`;

function isKind(v: string): v is Kind {
  return (KINDS as readonly string[]).includes(v);
}

export async function runQuery(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(QUERY_HELP);
    return EXIT.OK;
  }
  const kindRaw = opts.args.positionals[1];
  const ticker = opts.args.positionals[2];
  if (!kindRaw || !ticker) {
    return usageError('query: usage is "jintel query <kind> <ticker>"');
  }
  if (!isKind(kindRaw)) {
    return usageError(
      `query: invalid kind "${kindRaw}" (valid: ${KINDS.join(", ")})`,
    );
  }

  const since = getString(opts.args.flags, "since");
  const until = getString(opts.args.flags, "until");
  const limit = getNumber(opts.args.flags, "limit");
  const sort = parseSort(getString(opts.args.flags, "sort"));
  const arrayFilter: ArraySubGraphOptions | undefined =
    since || until || limit != null || sort
      ? { since, until, limit, sort }
      : undefined;

  // Route to the right sub-graph + filter slot. Every kind must have a case —
  // if you add to KINDS, add a case here (and to the MCP jintel_query switch).
  const wrap = (
    options: EnrichOptions | undefined,
    field: Parameters<typeof runSubGraphCommand>[2],
  ) => runSubGraphCommand(opts, ticker, field, options);

  switch (kindRaw) {
    case "market":
      return wrap(undefined, "market");
    case "fundamentals":
    case "financials":
      return wrap(undefined, "financials");
    case "news":
      return wrap({ newsFilter: arrayFilter }, "news");
    case "research":
      return wrap({ filter: arrayFilter }, "research");
    case "sentiment":
      return wrap(undefined, "sentiment");
    case "social":
      return wrap(undefined, "social");
    case "discussions":
      return wrap({ discussionsFilter: arrayFilter }, "discussions");
    case "predictions":
      return wrap({ predictionsFilter: arrayFilter }, "predictions");
    case "technicals":
      return wrap(undefined, "technicals");
    case "derivatives":
      return wrap(undefined, "derivatives");
    case "risk":
      return wrap({ riskSignalFilter: arrayFilter }, "risk");
    case "regulatory":
      return wrap({ filingsFilter: arrayFilter }, "regulatory");
    case "periodic_filings":
      return wrap({ filter: arrayFilter }, "periodicFilings");
    case "ownership":
      return wrap(undefined, "ownership");
    case "top_holders":
      return wrap({ topHoldersFilter: arrayFilter }, "topHolders");
    case "institutional_holdings":
      return wrap(
        { institutionalHoldingsFilter: arrayFilter },
        "institutionalHoldings",
      );
    case "insider_trades":
      return wrap({ insiderTradesFilter: arrayFilter }, "insiderTrades");
    case "executives":
      return wrap(undefined, "executives");
    case "earnings_press_releases":
      return wrap({ filter: arrayFilter }, "earningsPressReleases");
    case "segmented_revenue":
      return wrap({ segmentedRevenueFilter: arrayFilter }, "segmentedRevenue");
    case "earnings_calendar":
      return wrap({ earningsFilter: arrayFilter }, "earnings");
    case "analyst_consensus":
      return wrap(undefined, "analyst");
    case "clinical_trials":
      return wrap({ clinicalTrialsFilter: arrayFilter }, "clinicalTrials");
    case "fda_events":
      return wrap({ fdaEventsFilter: arrayFilter }, "fdaEvents");
    case "litigation":
      return wrap({ litigationFilter: arrayFilter }, "litigation");
    case "government_contracts":
      return wrap(
        { governmentContractsFilter: arrayFilter },
        "governmentContracts",
      );
    default: {
      // Compile-time exhaustiveness — if we miss a kind, this becomes a real
      // type error rather than a fall-through.
      const _exhaustive: never = kindRaw;
      return usageError(`query: unsupported kind "${_exhaustive}"`);
    }
  }
}
