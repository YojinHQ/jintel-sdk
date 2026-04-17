import { getString } from '../args.js';
import { buildClient, EXIT, type CommandOptions, type ExitCode, runCommand, unwrapResult, usageError } from '../common.js';
import { fmtNum, printJson, printTable } from '../format.js';

export const PRICE_HISTORY_HELP = `Usage: jintel price-history <ticker> [<ticker> ...] [flags]

Fetch OHLCV candles for up to 20 tickers.

Flags:
  --range <range>     Lookback range, e.g. 1d, 5d, 1mo, 3mo, 6mo, 1y (default 1y)
  --interval <iv>     Candle interval, e.g. 1d, 1h, 15m (default 1d)
  --json              Output JSON instead of a table
  --api-key <key>     Override API key
  --base-url <url>    Override API base URL
  --help              Show this message
`;

export async function runPriceHistory(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(PRICE_HISTORY_HELP);
    return EXIT.OK;
  }

  const tickers = opts.args.positionals.slice(1);
  if (tickers.length === 0) {
    return usageError('price-history: at least one ticker is required');
  }

  const range = getString(opts.args.flags, 'range');
  const interval = getString(opts.args.flags, 'interval');

  return runCommand(async () => {
    const client = buildClient(opts.args);
    const result = await client.priceHistory(tickers, range, interval);
    const data = unwrapResult(result);
    if (data === undefined) return EXIT.RUNTIME_ERROR;

    if (opts.json) {
      printJson(data);
      return EXIT.OK;
    }

    // Flatten to (ticker, date, o/h/l/c, volume) rows for the table view.
    const rows = data.flatMap((t) => t.history.map((p) => ({ ticker: t.ticker, ...p })));
    printTable(rows, [
      { header: 'TICKER', get: (r) => r.ticker },
      { header: 'DATE', get: (r) => r.date },
      { header: 'OPEN', align: 'right', get: (r) => fmtNum(r.open) },
      { header: 'HIGH', align: 'right', get: (r) => fmtNum(r.high) },
      { header: 'LOW', align: 'right', get: (r) => fmtNum(r.low) },
      { header: 'CLOSE', align: 'right', get: (r) => fmtNum(r.close) },
      { header: 'VOLUME', align: 'right', get: (r) => r.volume },
    ]);
    return EXIT.OK;
  });
}
