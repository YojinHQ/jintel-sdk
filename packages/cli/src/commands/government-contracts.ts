import type { GovernmentContractFilterOptions } from "@yojinhq/jintel-client";
import { getNumber, getString } from "../args.js";
import {
  EXIT,
  parseSort,
  type CommandOptions,
  type ExitCode,
  runSubGraphCommand,
  usageError,
} from "../common.js";

export const GOVERNMENT_CONTRACTS_HELP = `Usage: jintel government-contracts <ticker> [flags]

US government contracts awarded to an entity. Output is JSON.

Flags:
  --since <iso>      Only contracts on/after this ISO 8601 timestamp
  --until <iso>      Only contracts on/before this ISO 8601 timestamp
  --limit <n>        Cap result count (default 20)
  --sort <ASC|DESC>  Sort by date (default DESC)
  --min-amount <n>   Only contracts with amount >= n (USD)
  --offset <n>       Skip N rows for pagination
  --api-key <key>    Override API key
  --base-url <url>   Override API base URL
  --help             Show this message
`;

export async function runGovernmentContracts(
  opts: CommandOptions,
): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(GOVERNMENT_CONTRACTS_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("government-contracts: ticker is required");

  const since = getString(opts.args.flags, "since");
  const until = getString(opts.args.flags, "until");
  const limit = getNumber(opts.args.flags, "limit");
  const sort = parseSort(getString(opts.args.flags, "sort"));
  const minAmount = getNumber(opts.args.flags, "min-amount");
  const offset = getNumber(opts.args.flags, "offset");

  const governmentContractsFilter: GovernmentContractFilterOptions | undefined =
    since ||
    until ||
    limit != null ||
    sort ||
    minAmount != null ||
    offset != null
      ? { since, until, limit, sort, minAmount, offset }
      : undefined;

  return runSubGraphCommand(
    opts,
    ticker,
    "governmentContracts",
    governmentContractsFilter ? { governmentContractsFilter } : undefined,
  );
}
