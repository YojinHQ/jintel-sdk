import type { NewsFilterOptions } from "@yojinhq/jintel-client";
import { getNumber, getString, getStringList } from "../args.js";
import {
  EXIT,
  parseSort,
  type CommandOptions,
  type ExitCode,
  runSubGraphCommand,
  usageError,
} from "../common.js";

export const NEWS_HELP = `Usage: jintel news <ticker> [flags]

Recent news articles for an entity (sorted newest first). Output is JSON.

Flags:
  --since <iso>          Only articles on/after this ISO 8601 timestamp
  --until <iso>          Only articles on/before this ISO 8601 timestamp
  --limit <n>            Cap article count (default 20)
  --sort <ASC|DESC>      Sort by date (default DESC)
  --sources <csv>        Restrict to one or more source names
  --min-sentiment <n>    Only sentimentScore >= n (-1..+1)
  --max-sentiment <n>    Only sentimentScore <= n (-1..+1)
  --api-key <key>        Override API key
  --base-url <url>       Override API base URL
  --help                 Show this message
`;

export async function runNews(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(NEWS_HELP);
    return EXIT.OK;
  }

  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("news: ticker is required");

  const since = getString(opts.args.flags, "since");
  const until = getString(opts.args.flags, "until");
  const limit = getNumber(opts.args.flags, "limit");
  const sort = parseSort(getString(opts.args.flags, "sort"));
  const sources = getStringList(opts.args.flags, "sources");
  const minSentiment = getNumber(opts.args.flags, "min-sentiment");
  const maxSentiment = getNumber(opts.args.flags, "max-sentiment");

  const newsFilter: NewsFilterOptions | undefined =
    since ||
    until ||
    limit != null ||
    sort ||
    sources ||
    minSentiment != null ||
    maxSentiment != null
      ? { since, until, limit, sort, sources, minSentiment, maxSentiment }
      : undefined;

  return runSubGraphCommand(
    opts,
    ticker,
    "news",
    newsFilter ? { newsFilter } : undefined,
  );
}
