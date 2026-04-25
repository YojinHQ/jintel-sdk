import type { EarningsFilterOptions } from "@yojinhq/jintel-client";
import { getNumber, getString } from "../args.js";
import {
  EXIT,
  parseSort,
  type CommandOptions,
  type ExitCode,
  runSubGraphCommand,
  usageError,
} from "../common.js";

export const EARNINGS_CALENDAR_HELP = `Usage: jintel earnings-calendar <ticker> [flags]

Earnings calendar / report history — past and upcoming, with EPS estimate vs.
actual, revenue, and surprise. Output is JSON.

Flags:
  --since <iso>      Only entries on/after this ISO 8601 timestamp
  --until <iso>      Only entries on/before this ISO 8601 timestamp
  --limit <n>        Cap result count (default 20)
  --sort <ASC|DESC>  Sort by date (default DESC)
  --api-key <key>    Override API key
  --base-url <url>   Override API base URL
  --help             Show this message
`;

export async function runEarningsCalendar(
  opts: CommandOptions,
): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(EARNINGS_CALENDAR_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("earnings-calendar: ticker is required");

  const since = getString(opts.args.flags, "since");
  const until = getString(opts.args.flags, "until");
  const limit = getNumber(opts.args.flags, "limit");
  const sort = parseSort(getString(opts.args.flags, "sort"));

  const earningsFilter: EarningsFilterOptions | undefined =
    since || until || limit != null || sort
      ? { since, until, limit, sort }
      : undefined;

  return runSubGraphCommand(
    opts,
    ticker,
    "earnings",
    earningsFilter ? { earningsFilter } : undefined,
  );
}
