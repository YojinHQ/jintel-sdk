import type { PredictionMarketFilterOptions } from "@yojinhq/jintel-client";
import { getNumber, getString, getTriBool } from "../args.js";
import {
  EXIT,
  parseSort,
  type CommandOptions,
  type ExitCode,
  runSubGraphCommand,
  usageError,
} from "../common.js";

export const PREDICTIONS_HELP = `Usage: jintel predictions <ticker> [flags]

Polymarket / Kalshi prediction-market events referencing an entity. Output is JSON.

Flags:
  --since <iso>          Only events on/after this ISO 8601 timestamp
  --until <iso>          Only events on/before this ISO 8601 timestamp
  --limit <n>            Cap result count (default 20)
  --sort <ASC|DESC>      Sort by date (default DESC)
  --min-volume-24hr <n>  Only events with 24h volume >= n
  --min-liquidity <n>    Only events with liquidity >= n
  --only-open            Only events with unresolved outcomes
  --offset <n>           Skip N rows for pagination
  --api-key <key>        Override API key
  --base-url <url>       Override API base URL
  --help                 Show this message
`;

export async function runPredictions(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(PREDICTIONS_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("predictions: ticker is required");

  const since = getString(opts.args.flags, "since");
  const until = getString(opts.args.flags, "until");
  const limit = getNumber(opts.args.flags, "limit");
  const sort = parseSort(getString(opts.args.flags, "sort"));
  const minVolume24hr = getNumber(opts.args.flags, "min-volume-24hr");
  const minLiquidity = getNumber(opts.args.flags, "min-liquidity");
  const onlyOpen = getTriBool(opts.args.flags, "only-open");
  const offset = getNumber(opts.args.flags, "offset");

  const predictionsFilter: PredictionMarketFilterOptions | undefined =
    since ||
    until ||
    limit != null ||
    sort ||
    minVolume24hr != null ||
    minLiquidity != null ||
    onlyOpen != null ||
    offset != null
      ? {
          since,
          until,
          limit,
          sort,
          minVolume24hr,
          minLiquidity,
          onlyOpen,
          offset,
        }
      : undefined;

  return runSubGraphCommand(
    opts,
    ticker,
    "predictions",
    predictionsFilter ? { predictionsFilter } : undefined,
  );
}
