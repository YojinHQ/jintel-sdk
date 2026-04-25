import type { ArraySubGraphOptions } from "@yojinhq/jintel-client";
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

export const INFLATION_HELP = `Usage: jintel inflation <country> [flags]

CPI / inflation time series for a country.

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

export async function runInflation(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(INFLATION_HELP);
    return EXIT.OK;
  }
  const country = opts.args.positionals[1];
  if (!country) return usageError('inflation: country is required (e.g. "US")');

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
    const result = await client.inflation(country, filter);
    const data = unwrapResult(result);
    if (data === undefined) return EXIT.RUNTIME_ERROR;

    if (opts.json) {
      printJson(data);
      return EXIT.OK;
    }

    printTable(data, [
      { header: "DATE", get: (d) => d.date },
      { header: "COUNTRY", get: (d) => d.country ?? "" },
      {
        header: "VALUE",
        align: "right",
        get: (d) => fmtNum(d.value ?? null, 2),
      },
    ]);
    return EXIT.OK;
  });
}
