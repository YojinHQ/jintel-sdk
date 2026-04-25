import type {
  RiskSignalFilterOptions,
  RiskSignalType,
  Severity,
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

const RISK_SIGNAL_TYPES: readonly RiskSignalType[] = [
  "SANCTIONS",
  "LITIGATION",
  "REGULATORY_ACTION",
  "ADVERSE_MEDIA",
  "PEP",
];
const SEVERITIES: readonly Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const RISK_SIGNALS_HELP = `Usage: jintel risk-signals <ticker> [flags]

Risk signals attached to an entity — sanctions, litigation, regulatory actions,
adverse media, PEP. Output is JSON.

Flags:
  --since <iso>      Only items on/after this ISO 8601 timestamp
  --until <iso>      Only items on/before this ISO 8601 timestamp
  --limit <n>        Cap result count (default 20)
  --sort <ASC|DESC>  Sort by date (default DESC)
  --types <csv>      Restrict signal types: ${RISK_SIGNAL_TYPES.join(", ")}
  --severities <csv> Restrict severities: ${SEVERITIES.join(", ")}
  --api-key <key>    Override API key
  --base-url <url>   Override API base URL
  --help             Show this message
`;

export async function runRiskSignals(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(RISK_SIGNALS_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("risk-signals: ticker is required");

  const since = getString(opts.args.flags, "since");
  const until = getString(opts.args.flags, "until");
  const limit = getNumber(opts.args.flags, "limit");
  const sort = parseSort(getString(opts.args.flags, "sort"));
  const typesRaw = getStringList(opts.args.flags, "types");
  const types = filterEnumList(typesRaw, RISK_SIGNAL_TYPES);
  if (typesRaw && !types) {
    return usageError(
      `risk-signals: --types must be one of ${RISK_SIGNAL_TYPES.join(", ")}`,
    );
  }
  const severitiesRaw = getStringList(opts.args.flags, "severities");
  const severities = filterEnumList(severitiesRaw, SEVERITIES);
  if (severitiesRaw && !severities) {
    return usageError(
      `risk-signals: --severities must be one of ${SEVERITIES.join(", ")}`,
    );
  }

  const riskSignalFilter: RiskSignalFilterOptions | undefined =
    since || until || limit != null || sort || types || severities
      ? { since, until, limit, sort, types, severities }
      : undefined;

  return runSubGraphCommand(
    opts,
    ticker,
    "risk",
    riskSignalFilter ? { riskSignalFilter } : undefined,
  );
}
