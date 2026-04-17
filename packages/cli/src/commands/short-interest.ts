import { buildClient, EXIT, type CommandOptions, type ExitCode, runCommand, unwrapResult, usageError } from '../common.js';
import { fmtNum, printJson, printTable } from '../format.js';

export const SHORT_INTEREST_HELP = `Usage: jintel short-interest <ticker> [flags]

Fetch short-interest reports for a single ticker.

Flags:
  --json            Output JSON instead of a table
  --api-key <key>   Override API key
  --base-url <url>  Override API base URL
  --help            Show this message
`;

export async function runShortInterest(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(SHORT_INTEREST_HELP);
    return EXIT.OK;
  }

  const ticker = opts.args.positionals[1];
  if (!ticker) {
    return usageError('short-interest: ticker is required');
  }

  return runCommand(async () => {
    const client = buildClient(opts.args);
    const result = await client.shortInterest(ticker);
    const data = unwrapResult(result);
    if (data === undefined) return EXIT.RUNTIME_ERROR;

    if (opts.json) {
      printJson(data);
      return EXIT.OK;
    }

    printTable(data, [
      { header: 'TICKER', get: (r) => r.ticker },
      { header: 'DATE', get: (r) => r.reportDate },
      { header: 'SHORT INT', align: 'right', get: (r) => r.shortInterest ?? '' },
      { header: 'CHANGE', align: 'right', get: (r) => fmtNum(r.change ?? null) },
      { header: 'DAYS TO COVER', align: 'right', get: (r) => fmtNum(r.daysToCover ?? null) },
    ]);
    return EXIT.OK;
  });
}
