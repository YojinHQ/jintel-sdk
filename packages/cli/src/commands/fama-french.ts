import type { FamaFrenchSeries } from '@yojinhq/jintel-client';
import { getString } from '../args.js';
import { buildClient, EXIT, type CommandOptions, type ExitCode, runCommand, unwrapResult, usageError } from '../common.js';
import { fmtNum, printJson, printTable } from '../format.js';

const VALID_SERIES: readonly FamaFrenchSeries[] = [
  'THREE_FACTOR_DAILY',
  'THREE_FACTOR_MONTHLY',
  'FIVE_FACTOR_DAILY',
  'FIVE_FACTOR_MONTHLY',
];

export const FAMA_FRENCH_HELP = `Usage: jintel fama-french <series> [flags]

Fetch Fama-French factor returns.

Series:
  ${VALID_SERIES.join('\n  ')}

Flags:
  --range <range>   Lookback range (e.g. 1y, 5y)
  --json            Output JSON instead of a table
  --api-key <key>   Override API key
  --base-url <url>  Override API base URL
  --help            Show this message
`;

function isSeries(v: string): v is FamaFrenchSeries {
  return (VALID_SERIES as readonly string[]).includes(v);
}

export async function runFamaFrench(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(FAMA_FRENCH_HELP);
    return EXIT.OK;
  }

  const seriesRaw = opts.args.positionals[1];
  if (!seriesRaw) {
    return usageError(`fama-french: series is required (one of ${VALID_SERIES.join(', ')})`);
  }
  const series = seriesRaw.toUpperCase();
  if (!isSeries(series)) {
    return usageError(`fama-french: invalid series "${seriesRaw}" (valid: ${VALID_SERIES.join(', ')})`);
  }
  const range = getString(opts.args.flags, 'range');

  return runCommand(async () => {
    const client = buildClient(opts.args);
    const result = await client.famaFrenchFactors(series, range);
    const data = unwrapResult(result);
    if (data === undefined) return EXIT.RUNTIME_ERROR;

    if (opts.json) {
      printJson(data);
      return EXIT.OK;
    }

    printTable(data, [
      { header: 'DATE', get: (d) => d.date },
      { header: 'MKT-RF', align: 'right', get: (d) => fmtNum(d.mktRf ?? null, 4) },
      { header: 'SMB', align: 'right', get: (d) => fmtNum(d.smb ?? null, 4) },
      { header: 'HML', align: 'right', get: (d) => fmtNum(d.hml ?? null, 4) },
      { header: 'RMW', align: 'right', get: (d) => fmtNum(d.rmw ?? null, 4) },
      { header: 'CMA', align: 'right', get: (d) => fmtNum(d.cma ?? null, 4) },
      { header: 'RF', align: 'right', get: (d) => fmtNum(d.rf ?? null, 4) },
    ]);
    return EXIT.OK;
  });
}
