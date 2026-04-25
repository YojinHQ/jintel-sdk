import type {
  SegmentDimension,
  SegmentRevenueFilterOptions,
} from "@yojinhq/jintel-client";
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

const SEGMENT_DIMENSIONS: readonly SegmentDimension[] = [
  "PRODUCT",
  "SEGMENT",
  "GEOGRAPHY",
  "CUSTOMER",
];

export const SEGMENTED_REVENUE_HELP = `Usage: jintel segmented-revenue <ticker> [flags]

Revenue breakdown by product, segment, geography, or customer. Output is JSON.

Flags:
  --since <iso>      Only periods on/after this ISO 8601 date
  --until <iso>      Only periods on/before this ISO 8601 date
  --limit <n>        Cap result count (default 20)
  --sort <ASC|DESC>  Sort by date (default DESC)
  --dimensions <csv> Restrict to: ${SEGMENT_DIMENSIONS.join(", ")}
  --min-value <n>    Only rows with revenue >= n (USD)
  --api-key <key>    Override API key
  --base-url <url>   Override API base URL
  --help             Show this message
`;

export async function runSegmentedRevenue(
  opts: CommandOptions,
): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(SEGMENTED_REVENUE_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("segmented-revenue: ticker is required");

  const since = getString(opts.args.flags, "since");
  const until = getString(opts.args.flags, "until");
  const limit = getNumber(opts.args.flags, "limit");
  const sort = parseSort(getString(opts.args.flags, "sort"));
  const dimsRaw = getStringList(opts.args.flags, "dimensions");
  const dimensions = filterEnumList(dimsRaw, SEGMENT_DIMENSIONS);
  if (dimsRaw && !dimensions) {
    return usageError(
      `segmented-revenue: --dimensions must be from ${SEGMENT_DIMENSIONS.join(", ")}`,
    );
  }
  const minValue = getNumber(opts.args.flags, "min-value");

  const segmentedRevenueFilter: SegmentRevenueFilterOptions | undefined =
    since || until || limit != null || sort || dimensions || minValue != null
      ? { since, until, limit, sort, dimensions, minValue }
      : undefined;

  return runSubGraphCommand(
    opts,
    ticker,
    "segmentedRevenue",
    segmentedRevenueFilter ? { segmentedRevenueFilter } : undefined,
  );
}
