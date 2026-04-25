import type {
  FuturesCurveFilterOptions,
  OptionType,
  OptionsChainFilterOptions,
  OptionsChainSort,
} from "@yojinhq/jintel-client";
import { getNumber, getString } from "../args.js";
import {
  EXIT,
  parseEnum,
  parseSort,
  type CommandOptions,
  type ExitCode,
  runSubGraphCommand,
  usageError,
} from "../common.js";

const OPTION_TYPES: readonly OptionType[] = ["CALL", "PUT"];
const OPTIONS_CHAIN_SORTS: readonly OptionsChainSort[] = [
  "EXPIRATION_ASC",
  "EXPIRATION_DESC",
  "STRIKE_ASC",
  "STRIKE_DESC",
  "VOLUME_DESC",
  "OPEN_INTEREST_DESC",
];

export const DERIVATIVES_HELP = `Usage: jintel derivatives <ticker> [flags]

Derivatives data for an entity — futures curve and options chain. Best for
crypto and major equities. Output is JSON.

Futures flags:
  --futures-since <iso>     Only expirations on/after this ISO 8601 date
  --futures-until <iso>     Only expirations on/before this ISO 8601 date
  --futures-limit <n>       Cap futures count (default 50)
  --futures-sort <ASC|DESC> Sort by expiration (default ASC)

Options flags (chains can exceed 5,000 rows — narrow them):
  --options-since <iso>      Only expirations on/after this ISO 8601 date
  --options-until <iso>      Only expirations on/before this ISO 8601 date
  --strike-min <n>           Minimum strike (inclusive)
  --strike-max <n>           Maximum strike (inclusive)
  --option-type <CALL|PUT>   Restrict contract type
  --min-volume <n>           Drop contracts with volume below threshold
  --min-open-interest <n>    Drop contracts with OI below threshold
  --options-limit <n>        Cap options count (default 100)
  --options-sort <kind>      ${OPTIONS_CHAIN_SORTS.join(" | ")}

Common:
  --api-key <key>    Override API key
  --base-url <url>   Override API base URL
  --help             Show this message
`;

export async function runDerivatives(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(DERIVATIVES_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("derivatives: ticker is required");

  const futuresSince = getString(opts.args.flags, "futures-since");
  const futuresUntil = getString(opts.args.flags, "futures-until");
  const futuresLimit = getNumber(opts.args.flags, "futures-limit");
  const futuresSort = parseSort(getString(opts.args.flags, "futures-sort"));
  const futuresFilter: FuturesCurveFilterOptions | undefined =
    futuresSince || futuresUntil || futuresLimit != null || futuresSort
      ? {
          since: futuresSince,
          until: futuresUntil,
          limit: futuresLimit,
          sort: futuresSort,
        }
      : undefined;

  const optionsSince = getString(opts.args.flags, "options-since");
  const optionsUntil = getString(opts.args.flags, "options-until");
  const strikeMin = getNumber(opts.args.flags, "strike-min");
  const strikeMax = getNumber(opts.args.flags, "strike-max");
  const optionTypeRaw = getString(opts.args.flags, "option-type");
  const optionType = parseEnum(optionTypeRaw, OPTION_TYPES);
  if (optionTypeRaw && !optionType) {
    return usageError(`derivatives: --option-type must be CALL or PUT`);
  }
  const minVolume = getNumber(opts.args.flags, "min-volume");
  const minOpenInterest = getNumber(opts.args.flags, "min-open-interest");
  const optionsLimit = getNumber(opts.args.flags, "options-limit");
  const optionsSortRaw = getString(opts.args.flags, "options-sort");
  const optionsSort = parseEnum(optionsSortRaw, OPTIONS_CHAIN_SORTS);
  if (optionsSortRaw && !optionsSort) {
    return usageError(
      `derivatives: --options-sort must be one of ${OPTIONS_CHAIN_SORTS.join(", ")}`,
    );
  }
  const optionsFilter: OptionsChainFilterOptions | undefined =
    optionsSince ||
    optionsUntil ||
    strikeMin != null ||
    strikeMax != null ||
    optionType ||
    minVolume != null ||
    minOpenInterest != null ||
    optionsLimit != null ||
    optionsSort
      ? {
          since: optionsSince,
          until: optionsUntil,
          strikeMin,
          strikeMax,
          optionType,
          minVolume,
          minOpenInterest,
          limit: optionsLimit,
          sort: optionsSort,
        }
      : undefined;

  return runSubGraphCommand(opts, ticker, "derivatives", {
    futuresFilter,
    optionsFilter,
  });
}
