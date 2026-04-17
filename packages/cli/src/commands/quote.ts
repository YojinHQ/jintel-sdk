import { buildClient, EXIT, type CommandOptions, type ExitCode, runCommand, unwrapResult, usageError } from '../common.js';
import { fmtNum, fmtPct, printJson, printTable } from '../format.js';

export const QUOTE_HELP = `Usage: jintel quote <ticker> [<ticker> ...] [flags]

Fetch latest quotes for one or more tickers.

Flags:
  --json            Output JSON instead of a table
  --api-key <key>   Override API key
  --base-url <url>  Override API base URL
  --help            Show this message
`;

export async function runQuote(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(QUOTE_HELP);
    return EXIT.OK;
  }

  const tickers = opts.args.positionals.slice(1); // drop the subcommand itself
  if (tickers.length === 0) {
    return usageError('quote: at least one ticker is required');
  }

  return runCommand(async () => {
    const client = buildClient(opts.args);
    const result = await client.quotes(tickers);
    const data = unwrapResult(result);
    if (data === undefined) return EXIT.RUNTIME_ERROR;

    if (opts.json) {
      printJson(data);
      return EXIT.OK;
    }

    printTable(data, [
      { header: 'TICKER', get: (q) => q.ticker },
      { header: 'PRICE', align: 'right', get: (q) => fmtNum(q.price) },
      { header: 'CHANGE', align: 'right', get: (q) => fmtNum(q.change) },
      { header: 'CHG%', align: 'right', get: (q) => fmtPct(q.changePercent) },
      { header: 'VOLUME', align: 'right', get: (q) => q.volume },
      { header: 'MKT CAP', align: 'right', get: (q) => q.marketCap ?? '' },
      { header: 'SOURCE', get: (q) => q.source },
    ]);
    return EXIT.OK;
  });
}
