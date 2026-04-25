import type {
  FdaEventFilterOptions,
  FdaEventType,
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

const FDA_EVENT_TYPES: readonly FdaEventType[] = [
  "DRUG_ADVERSE",
  "DEVICE_ADVERSE",
  "DRUG_RECALL",
];

export const FDA_EVENTS_HELP = `Usage: jintel fda-events <ticker> [flags]

FDA adverse events and recalls referencing an entity. Output is JSON.

Flags:
  --since <iso>      Only events on/after this ISO 8601 timestamp
  --until <iso>      Only events on/before this ISO 8601 timestamp
  --limit <n>        Cap result count (default 20)
  --sort <ASC|DESC>  Sort by date (default DESC)
  --types <csv>      Restrict to: ${FDA_EVENT_TYPES.join(", ")}
  --severity <s>     Exact severity match (e.g. 'CLASS I')
  --offset <n>       Skip N rows for pagination
  --api-key <key>    Override API key
  --base-url <url>   Override API base URL
  --help             Show this message
`;

export async function runFdaEvents(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(FDA_EVENTS_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("fda-events: ticker is required");

  const since = getString(opts.args.flags, "since");
  const until = getString(opts.args.flags, "until");
  const limit = getNumber(opts.args.flags, "limit");
  const sort = parseSort(getString(opts.args.flags, "sort"));
  const typesRaw = getStringList(opts.args.flags, "types");
  const types = filterEnumList(typesRaw, FDA_EVENT_TYPES);
  if (typesRaw && !types) {
    return usageError(
      `fda-events: --types must be from ${FDA_EVENT_TYPES.join(", ")}`,
    );
  }
  const severity = getString(opts.args.flags, "severity");
  const offset = getNumber(opts.args.flags, "offset");

  const fdaEventsFilter: FdaEventFilterOptions | undefined =
    since ||
    until ||
    limit != null ||
    sort ||
    types ||
    severity ||
    offset != null
      ? { since, until, limit, sort, types, severity, offset }
      : undefined;

  return runSubGraphCommand(
    opts,
    ticker,
    "fdaEvents",
    fdaEventsFilter ? { fdaEventsFilter } : undefined,
  );
}
