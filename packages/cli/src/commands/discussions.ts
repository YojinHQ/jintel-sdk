import type { DiscussionsFilterOptions } from "@yojinhq/jintel-client";
import { getNumber, getString } from "../args.js";
import {
  EXIT,
  parseSort,
  type CommandOptions,
  type ExitCode,
  runSubGraphCommand,
  usageError,
} from "../common.js";

export const DISCUSSIONS_HELP = `Usage: jintel discussions <ticker> [flags]

Hacker News stories mentioning an entity. Output is JSON.

Flags:
  --since <iso>      Only stories on/after this ISO 8601 timestamp
  --until <iso>      Only stories on/before this ISO 8601 timestamp
  --limit <n>        Cap result count (default 20)
  --sort <ASC|DESC>  Sort by date (default DESC)
  --min-points <n>   Only stories with points >= n
  --min-comments <n> Only stories with comments >= n
  --offset <n>       Skip N rows for pagination
  --api-key <key>    Override API key
  --base-url <url>   Override API base URL
  --help             Show this message
`;

export async function runDiscussions(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(DISCUSSIONS_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("discussions: ticker is required");

  const since = getString(opts.args.flags, "since");
  const until = getString(opts.args.flags, "until");
  const limit = getNumber(opts.args.flags, "limit");
  const sort = parseSort(getString(opts.args.flags, "sort"));
  const minPoints = getNumber(opts.args.flags, "min-points");
  const minComments = getNumber(opts.args.flags, "min-comments");
  const offset = getNumber(opts.args.flags, "offset");

  const discussionsFilter: DiscussionsFilterOptions | undefined =
    since ||
    until ||
    limit != null ||
    sort ||
    minPoints != null ||
    minComments != null ||
    offset != null
      ? { since, until, limit, sort, minPoints, minComments, offset }
      : undefined;

  return runSubGraphCommand(
    opts,
    ticker,
    "discussions",
    discussionsFilter ? { discussionsFilter } : undefined,
  );
}
