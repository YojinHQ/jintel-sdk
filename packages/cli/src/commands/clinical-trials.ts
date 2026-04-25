import type { ClinicalTrialFilterOptions } from "@yojinhq/jintel-client";
import { getNumber, getString } from "../args.js";
import {
  EXIT,
  parseSort,
  type CommandOptions,
  type ExitCode,
  runSubGraphCommand,
  usageError,
} from "../common.js";

export const CLINICAL_TRIALS_HELP = `Usage: jintel clinical-trials <ticker> [flags]

Clinical trial registrations referencing an entity (sponsor or drug).
Output is JSON.

Flags:
  --since <iso>      Only trials on/after this ISO 8601 timestamp
  --until <iso>      Only trials on/before this ISO 8601 timestamp
  --limit <n>        Cap result count (default 20)
  --sort <ASC|DESC>  Sort by date (default DESC)
  --phase <p>        Case-insensitive phase match (e.g. PHASE3)
  --status <s>       Exact status match (e.g. RECRUITING, COMPLETED)
  --offset <n>       Skip N rows for pagination
  --api-key <key>    Override API key
  --base-url <url>   Override API base URL
  --help             Show this message
`;

export async function runClinicalTrials(
  opts: CommandOptions,
): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(CLINICAL_TRIALS_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("clinical-trials: ticker is required");

  const since = getString(opts.args.flags, "since");
  const until = getString(opts.args.flags, "until");
  const limit = getNumber(opts.args.flags, "limit");
  const sort = parseSort(getString(opts.args.flags, "sort"));
  const phase = getString(opts.args.flags, "phase");
  const status = getString(opts.args.flags, "status");
  const offset = getNumber(opts.args.flags, "offset");

  const clinicalTrialsFilter: ClinicalTrialFilterOptions | undefined =
    since || until || limit != null || sort || phase || status || offset != null
      ? { since, until, limit, sort, phase, status, offset }
      : undefined;

  return runSubGraphCommand(
    opts,
    ticker,
    "clinicalTrials",
    clinicalTrialsFilter ? { clinicalTrialsFilter } : undefined,
  );
}
