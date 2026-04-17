import { buildClient, EXIT, type CommandOptions, type ExitCode, runCommand, unwrapResult } from '../common.js';
import { printJson, printTable } from '../format.js';

export const MARKET_STATUS_HELP = `Usage: jintel market-status [flags]

Show current US market status (session, holiday, trading day).

Flags:
  --json            Output JSON instead of a table
  --api-key <key>   Override API key
  --base-url <url>  Override API base URL
  --help            Show this message
`;

export async function runMarketStatus(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(MARKET_STATUS_HELP);
    return EXIT.OK;
  }

  return runCommand(async () => {
    const client = buildClient(opts.args);
    const result = await client.marketStatus();
    const data = unwrapResult(result);
    if (data === undefined) return EXIT.RUNTIME_ERROR;

    if (opts.json) {
      printJson(data);
      return EXIT.OK;
    }

    printTable(
      [data],
      [
        { header: 'DATE', get: (s) => s.date },
        { header: 'SESSION', get: (s) => s.session },
        { header: 'OPEN', get: (s) => (s.isOpen ? 'yes' : 'no') },
        { header: 'TRADING DAY', get: (s) => (s.isTradingDay ? 'yes' : 'no') },
        { header: 'HOLIDAY', get: (s) => s.holiday ?? '' },
      ],
    );
    return EXIT.OK;
  });
}
