import type { TopHoldersFilterOptions } from "@yojinhq/jintel-client";
import { getNumber, getString } from "../args.js";
import {
  EXIT,
  parseSort,
  type CommandOptions,
  type ExitCode,
  runSubGraphCommand,
  usageError,
} from "../common.js";

export const TOP_HOLDERS_HELP = `Usage: jintel top-holders <ticker> [flags]

Top institutional holders of an entity (by shares held). Output is JSON.

Flags:
  --since <iso>      Only filings on/after this ISO 8601 timestamp
  --until <iso>      Only filings on/before this ISO 8601 timestamp
  --limit <n>        Cap result count (default 20)
  --sort <ASC|DESC>  Sort by date (default DESC)
  --min-value <n>    Only holders with position value >= n (USD)
  --offset <n>       Skip N rows for pagination
  --api-key <key>    Override API key
  --base-url <url>   Override API base URL
  --help             Show this message
`;

export async function runTopHolders(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(TOP_HOLDERS_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("top-holders: ticker is required");

  const since = getString(opts.args.flags, "since");
  const until = getString(opts.args.flags, "until");
  const limit = getNumber(opts.args.flags, "limit");
  const sort = parseSort(getString(opts.args.flags, "sort"));
  const minValue = getNumber(opts.args.flags, "min-value");
  const offset = getNumber(opts.args.flags, "offset");

  const topHoldersFilter: TopHoldersFilterOptions | undefined =
    since ||
    until ||
    limit != null ||
    sort ||
    minValue != null ||
    offset != null
      ? { since, until, limit, sort, minValue, offset }
      : undefined;

  return runSubGraphCommand(
    opts,
    ticker,
    "topHolders",
    topHoldersFilter ? { topHoldersFilter } : undefined,
  );
}
