import type { FilingType, FilingsFilterOptions } from "@yojinhq/jintel-client";
import { getNumber, getString, getStringList } from "../args.js";
import {
  EXIT,
  filterEnumList,
  parseSort,
  type CommandOptions,
  type ExitCode,
  runSubGraphCommand,
  usageError,
} from "../common.js";

const FILING_TYPES: readonly FilingType[] = [
  "FILING_10K",
  "FILING_10Q",
  "FILING_8K",
  "ANNUAL_REPORT",
  "OTHER",
];

export const REGULATORY_HELP = `Usage: jintel regulatory <ticker> [flags]

Regulatory data for an entity — SEC filings, sanctions matches, campaign
finance. Output is JSON.

Flags:
  --since <iso>            Only filings on/after this ISO 8601 timestamp
  --until <iso>            Only filings on/before this ISO 8601 timestamp
  --limit <n>              Cap result count (default 20)
  --sort <ASC|DESC>        Sort by date (default DESC)
  --filing-types <csv>     Restrict to: ${FILING_TYPES.join(", ")}
  --api-key <key>          Override API key
  --base-url <url>         Override API base URL
  --help                   Show this message
`;

export async function runRegulatory(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(REGULATORY_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("regulatory: ticker is required");

  const since = getString(opts.args.flags, "since");
  const until = getString(opts.args.flags, "until");
  const limit = getNumber(opts.args.flags, "limit");
  const sort = parseSort(getString(opts.args.flags, "sort"));
  const typesRaw = getStringList(opts.args.flags, "filing-types");
  const types = filterEnumList(typesRaw, FILING_TYPES);
  if (typesRaw && !types) {
    return usageError(
      `regulatory: --filing-types must be one of ${FILING_TYPES.join(", ")}`,
    );
  }

  const filingsFilter: FilingsFilterOptions | undefined =
    since || until || limit != null || sort || types
      ? { since, until, limit, sort, types }
      : undefined;

  return runSubGraphCommand(
    opts,
    ticker,
    "regulatory",
    filingsFilter ? { filingsFilter } : undefined,
  );
}
