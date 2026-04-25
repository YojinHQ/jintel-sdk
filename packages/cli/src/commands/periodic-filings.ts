import type { ArraySubGraphOptions } from "@yojinhq/jintel-client";
import { getNumber, getString } from "../args.js";
import {
  EXIT,
  parseSort,
  type CommandOptions,
  type ExitCode,
  runSubGraphCommand,
  usageError,
} from "../common.js";

export const PERIODIC_FILINGS_HELP = `Usage: jintel periodic-filings <ticker> [flags]

Quarterly / annual SEC filings (10-K, 10-Q, 8-K) with summary metadata and
links. Output is JSON.

Flags:
  --since <iso>      Only filings on/after this ISO 8601 timestamp
  --until <iso>      Only filings on/before this ISO 8601 timestamp
  --limit <n>        Cap result count (default 20)
  --sort <ASC|DESC>  Sort by date (default DESC)
  --api-key <key>    Override API key
  --base-url <url>   Override API base URL
  --help             Show this message
`;

export async function runPeriodicFilings(
  opts: CommandOptions,
): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(PERIODIC_FILINGS_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("periodic-filings: ticker is required");

  const since = getString(opts.args.flags, "since");
  const until = getString(opts.args.flags, "until");
  const limit = getNumber(opts.args.flags, "limit");
  const sort = parseSort(getString(opts.args.flags, "sort"));

  const filter: ArraySubGraphOptions | undefined =
    since || until || limit != null || sort
      ? { since, until, limit, sort }
      : undefined;

  return runSubGraphCommand(
    opts,
    ticker,
    "periodicFilings",
    filter ? { filter } : undefined,
  );
}
