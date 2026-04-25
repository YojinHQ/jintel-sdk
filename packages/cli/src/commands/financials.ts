import type { FinancialStatementFilterOptions } from "@yojinhq/jintel-client";
import { getNumber, getString, getStringList } from "../args.js";
import {
  EXIT,
  parseSort,
  type CommandOptions,
  type ExitCode,
  runSubGraphCommand,
  usageError,
} from "../common.js";

export const FINANCIALS_HELP = `Usage: jintel financials <ticker> [flags]

Income statement, balance sheet, and cash flow statement for an entity.
Output is JSON.

Flags:
  --since <iso>          Only periods on/after this ISO 8601 date
  --until <iso>          Only periods on/before this ISO 8601 date
  --limit <n>            Cap result count (default 20)
  --sort <ASC|DESC>      Sort by date (default DESC)
  --period-types <csv>   Restrict period codes (e.g. 12M annual, 3M quarterly)
  --api-key <key>        Override API key
  --base-url <url>       Override API base URL
  --help                 Show this message
`;

export async function runFinancials(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(FINANCIALS_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("financials: ticker is required");

  const since = getString(opts.args.flags, "since");
  const until = getString(opts.args.flags, "until");
  const limit = getNumber(opts.args.flags, "limit");
  const sort = parseSort(getString(opts.args.flags, "sort"));
  const periodTypes = getStringList(opts.args.flags, "period-types");

  const financialStatementsFilter: FinancialStatementFilterOptions | undefined =
    since || until || limit != null || sort || periodTypes
      ? { since, until, limit, sort, periodTypes }
      : undefined;

  return runSubGraphCommand(
    opts,
    ticker,
    "financials",
    financialStatementsFilter ? { financialStatementsFilter } : undefined,
  );
}
