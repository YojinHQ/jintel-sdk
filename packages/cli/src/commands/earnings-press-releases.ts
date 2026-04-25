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

export const EARNINGS_PRESS_RELEASES_HELP = `Usage: jintel earnings-press-releases <ticker> [flags]

Earnings press releases (with summaries and links). Output is JSON.

Flags:
  --since <iso>      Only items on/after this ISO 8601 timestamp
  --until <iso>      Only items on/before this ISO 8601 timestamp
  --limit <n>        Cap result count (default 20)
  --sort <ASC|DESC>  Sort by date (default DESC)
  --api-key <key>    Override API key
  --base-url <url>   Override API base URL
  --help             Show this message
`;

export async function runEarningsPressReleases(
  opts: CommandOptions,
): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(EARNINGS_PRESS_RELEASES_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("earnings-press-releases: ticker is required");

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
    "earningsPressReleases",
    filter ? { filter } : undefined,
  );
}
