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
import { printJson } from "../format.js";

export const MACRO_SERIES_HELP = `Usage: jintel macro-series <id[,id,...]> [flags]

Generic US macro time series by ID (FRED-style codes — UNRATE, CPIAUCSL,
GDPC1, DGS10, T10Y2Y, etc). Pass a single ID for one series, or a
comma-separated list to batch-fetch multiple in one call. Output is JSON.

Flags:
  --since <iso>      Only observations on/after this ISO 8601 date
  --until <iso>      Only observations on/before this ISO 8601 date
  --limit <n>        Cap observation count per series
  --sort <ASC|DESC>  Sort by date (default DESC)
  --api-key <key>    Override API key
  --base-url <url>   Override API base URL
  --help             Show this message
`;

export async function runMacroSeries(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(MACRO_SERIES_HELP);
    return EXIT.OK;
  }
  const raw = opts.args.positionals[1];
  if (!raw)
    return usageError('macro-series: series ID is required (e.g. "UNRATE")');

  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (ids.length === 0) {
    return usageError("macro-series: at least one series ID is required");
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
    if (ids.length === 1) {
      const result = await client.macroSeries(ids[0], filter);
      const data = unwrapResult(result);
      if (data === undefined) return EXIT.RUNTIME_ERROR;
      printJson(data);
      return EXIT.OK;
    }
    const result = await client.macroSeriesBatch(ids, filter);
    const data = unwrapResult(result);
    if (data === undefined) return EXIT.RUNTIME_ERROR;
    printJson(data);
    return EXIT.OK;
  });
}
