import type {
  AcquisitionDirection,
  InsiderTradeFilterOptions,
} from "@yojinhq/jintel-client";
import { getNumber, getString, getStringList, getTriBool } from "../args.js";
import {
  EXIT,
  parseEnum,
  parseSort,
  type CommandOptions,
  type ExitCode,
  runSubGraphCommand,
  usageError,
} from "../common.js";

const ACQUISITION_DIRECTIONS: readonly AcquisitionDirection[] = [
  "ACQUIRED",
  "DISPOSED",
];

export const INSIDER_TRADES_HELP = `Usage: jintel insider-trades <ticker> [flags]

Insider Form 4 transactions for an entity — purchases, sales, option exercises
by officers, directors, and 10% owners. Output is JSON.

Flags:
  --since <iso>             Only trades on/after this ISO 8601 timestamp
  --until <iso>             Only trades on/before this ISO 8601 timestamp
  --limit <n>               Cap result count (default 20)
  --sort <ASC|DESC>         Sort by date (default DESC)
  --is-officer              Only by officers
  --is-director             Only by directors
  --is-10pct-owner          Only by 10% owners
  --only-under-10b5-1       Only trades under Rule 10b5-1 plan
  --transaction-codes <csv> Restrict to Form 4 codes (P, S, A, F, M, G, J, D)
  --acquired-disposed <dir> ${ACQUISITION_DIRECTIONS.join(" | ")}
  --min-value <n>           Only trades with transactionValue >= n (USD)
  --api-key <key>           Override API key
  --base-url <url>          Override API base URL
  --help                    Show this message
`;

export async function runInsiderTrades(
  opts: CommandOptions,
): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(INSIDER_TRADES_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("insider-trades: ticker is required");

  const since = getString(opts.args.flags, "since");
  const until = getString(opts.args.flags, "until");
  const limit = getNumber(opts.args.flags, "limit");
  const sort = parseSort(getString(opts.args.flags, "sort"));
  const isOfficer = getTriBool(opts.args.flags, "is-officer");
  const isDirector = getTriBool(opts.args.flags, "is-director");
  const isTenPercentOwner = getTriBool(opts.args.flags, "is-10pct-owner");
  const onlyUnder10b5One = getTriBool(opts.args.flags, "only-under-10b5-1");
  const transactionCodes = getStringList(opts.args.flags, "transaction-codes");
  const acquiredDisposedRaw = getString(opts.args.flags, "acquired-disposed");
  const acquiredDisposed = parseEnum(
    acquiredDisposedRaw,
    ACQUISITION_DIRECTIONS,
  );
  if (acquiredDisposedRaw && !acquiredDisposed) {
    return usageError(
      `insider-trades: --acquired-disposed must be one of ${ACQUISITION_DIRECTIONS.join(", ")}`,
    );
  }
  const minValue = getNumber(opts.args.flags, "min-value");

  const insiderTradesFilter: InsiderTradeFilterOptions | undefined =
    since ||
    until ||
    limit != null ||
    sort ||
    isOfficer != null ||
    isDirector != null ||
    isTenPercentOwner != null ||
    onlyUnder10b5One != null ||
    transactionCodes ||
    acquiredDisposed ||
    minValue != null
      ? {
          since,
          until,
          limit,
          sort,
          isOfficer,
          isDirector,
          isTenPercentOwner,
          onlyUnder10b5One,
          transactionCodes,
          acquiredDisposed,
          minValue,
        }
      : undefined;

  return runSubGraphCommand(
    opts,
    ticker,
    "insiderTrades",
    insiderTradesFilter ? { insiderTradesFilter } : undefined,
  );
}
