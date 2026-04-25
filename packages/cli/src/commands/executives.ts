import type {
  ExecutiveSort,
  ExecutivesFilterOptions,
} from "@yojinhq/jintel-client";
import { getNumber, getString } from "../args.js";
import {
  EXIT,
  parseEnum,
  type CommandOptions,
  type ExitCode,
  runSubGraphCommand,
  usageError,
} from "../common.js";

const EXECUTIVE_SORTS: readonly ExecutiveSort[] = [
  "PAY_DESC",
  "PAY_ASC",
  "NAME_ASC",
  "NAME_DESC",
];

export const EXECUTIVES_HELP = `Usage: jintel executives <ticker> [flags]

Key executives and named officers, with annual compensation. Output is JSON.

Flags:
  --min-pay <n>      Only executives with annual pay >= n (USD)
  --limit <n>        Cap result count (default 20)
  --sort-by <kind>   ${EXECUTIVE_SORTS.join(" | ")}
  --api-key <key>    Override API key
  --base-url <url>   Override API base URL
  --help             Show this message
`;

export async function runExecutives(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(EXECUTIVES_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("executives: ticker is required");

  const minPay = getNumber(opts.args.flags, "min-pay");
  const limit = getNumber(opts.args.flags, "limit");
  const sortByRaw = getString(opts.args.flags, "sort-by");
  const sortBy = parseEnum(sortByRaw, EXECUTIVE_SORTS);
  if (sortByRaw && !sortBy) {
    return usageError(
      `executives: --sort-by must be one of ${EXECUTIVE_SORTS.join(", ")}`,
    );
  }

  const executivesFilter: ExecutivesFilterOptions | undefined =
    minPay != null || limit != null || sortBy
      ? { minPay, limit, sortBy }
      : undefined;

  return runSubGraphCommand(
    opts,
    ticker,
    "executives",
    executivesFilter ? { executivesFilter } : undefined,
  );
}
