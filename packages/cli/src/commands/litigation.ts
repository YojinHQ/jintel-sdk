import type { LitigationFilterOptions } from "@yojinhq/jintel-client";
import { getNumber, getString, getTriBool } from "../args.js";
import {
  EXIT,
  parseSort,
  type CommandOptions,
  type ExitCode,
  runSubGraphCommand,
  usageError,
} from "../common.js";

export const LITIGATION_HELP = `Usage: jintel litigation <ticker> [flags]

Active and historical lawsuits involving an entity. Output is JSON.

Flags:
  --since <iso>           Only cases on/after this ISO 8601 timestamp
  --until <iso>           Only cases on/before this ISO 8601 timestamp
  --limit <n>             Cap result count (default 20)
  --sort <ASC|DESC>       Sort by date (default DESC)
  --only-active           Only cases without termination date
  --court <s>             Case-insensitive court substring (e.g. "N.D. CAL")
  --nature-of-suit <s>    Case-insensitive nature substring (e.g. PATENT)
  --offset <n>            Skip N rows for pagination
  --api-key <key>         Override API key
  --base-url <url>        Override API base URL
  --help                  Show this message
`;

export async function runLitigation(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(LITIGATION_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("litigation: ticker is required");

  const since = getString(opts.args.flags, "since");
  const until = getString(opts.args.flags, "until");
  const limit = getNumber(opts.args.flags, "limit");
  const sort = parseSort(getString(opts.args.flags, "sort"));
  const onlyActive = getTriBool(opts.args.flags, "only-active");
  const court = getString(opts.args.flags, "court");
  const natureOfSuit = getString(opts.args.flags, "nature-of-suit");
  const offset = getNumber(opts.args.flags, "offset");

  const litigationFilter: LitigationFilterOptions | undefined =
    since ||
    until ||
    limit != null ||
    sort ||
    onlyActive != null ||
    court ||
    natureOfSuit ||
    offset != null
      ? { since, until, limit, sort, onlyActive, court, natureOfSuit, offset }
      : undefined;

  return runSubGraphCommand(
    opts,
    ticker,
    "litigation",
    litigationFilter ? { litigationFilter } : undefined,
  );
}
