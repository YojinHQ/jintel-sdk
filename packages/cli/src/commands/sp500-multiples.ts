import type { ArraySubGraphOptions, SP500Series } from "@yojinhq/jintel-client";
import { getNumber, getString } from "../args.js";
import {
  buildClient,
  EXIT,
  parseSort,
  type CommandOptions,
  type ExitCode,
  runCommand,
  unwrapResult,
  usageError,
} from "../common.js";
import { fmtNum, printJson, printTable } from "../format.js";

const SP500_SERIES: readonly SP500Series[] = [
  "PE_MONTH",
  "SHILLER_PE_MONTH",
  "DIVIDEND_YIELD_MONTH",
  "EARNINGS_YIELD_MONTH",
];

export const SP500_MULTIPLES_HELP = `Usage: jintel sp500-multiples <series> [flags]

S&P 500 valuation multiples — PE, Shiller PE (CAPE), dividend yield,
earnings yield.

Series:
  ${SP500_SERIES.join("\n  ")}

Flags:
  --since <iso>      Only observations on/after this ISO 8601 date
  --until <iso>      Only observations on/before this ISO 8601 date
  --limit <n>        Cap result count
  --sort <ASC|DESC>  Sort by date (default DESC)
  --json             Output JSON instead of a table
  --api-key <key>    Override API key
  --base-url <url>   Override API base URL
  --help             Show this message
`;

function isSeries(v: string): v is SP500Series {
  return (SP500_SERIES as readonly string[]).includes(v);
}

export async function runSp500Multiples(
  opts: CommandOptions,
): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(SP500_MULTIPLES_HELP);
    return EXIT.OK;
  }
  const seriesRaw = opts.args.positionals[1];
  if (!seriesRaw) {
    return usageError(
      `sp500-multiples: series is required (one of ${SP500_SERIES.join(", ")})`,
    );
  }
  const series = seriesRaw.toUpperCase();
  if (!isSeries(series)) {
    return usageError(
      `sp500-multiples: invalid series "${seriesRaw}" (valid: ${SP500_SERIES.join(", ")})`,
    );
  }

  const since = getString(opts.args.flags, "since");
  const until = getString(opts.args.flags, "until");
  const limit = getNumber(opts.args.flags, "limit");
  const sort = parseSort(getString(opts.args.flags, "sort"));
  const filter: ArraySubGraphOptions | undefined =
    since || until || limit != null || sort
      ? { since, until, limit, sort }
      : undefined;

  return runCommand(async () => {
    const client = buildClient(opts.args);
    const result = await client.sp500Multiples(series, filter);
    const data = unwrapResult(result);
    if (data === undefined) return EXIT.RUNTIME_ERROR;

    if (opts.json) {
      printJson(data);
      return EXIT.OK;
    }

    printTable(data, [
      { header: "DATE", get: (d) => d.date },
      { header: "NAME", get: (d) => d.name },
      { header: "VALUE", align: "right", get: (d) => fmtNum(d.value, 4) },
    ]);
    return EXIT.OK;
  });
}
