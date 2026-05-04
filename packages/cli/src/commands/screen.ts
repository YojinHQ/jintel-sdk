import { getNumber, getString } from '../args.js';
import {
  buildClient,
  EXIT,
  type CommandOptions,
  type ExitCode,
  runCommand,
  unwrapResult,
  usageError,
} from '../common.js';
import { fmtNum, fmtPct, printJson, printTable } from '../format.js';
import type { ScreenFilterOptions, ScreenResult, ScreenUniverse } from '@yojinhq/jintel-client';

const UNIVERSES: ScreenUniverse[] = [
  'MOST_ACTIVES',
  'DAY_GAINERS',
  'DAY_LOSERS',
  'AGGRESSIVE_SMALL_CAPS',
  'GROWTH_TECHNOLOGY_STOCKS',
  'UNDERVALUED_LARGE_CAPS',
  'UNDERVALUED_GROWTH_STOCKS',
  'MOST_SHORTED',
];

export const SCREEN_HELP = `Usage: jintel screen [flags]

Filter a predefined US-equity universe by price, gap %, change %, relative
volume, dollar volume, and market cap. Targets workflows like:
  jintel screen --gap-min 2 --gap-max 4 --rvol-min 2 --price-min 5

Flags:
  --universe <id>      One of: ${UNIVERSES.join(', ')} (default MOST_ACTIVES)
  --price-min <usd>    Minimum share price (USD)
  --price-max <usd>    Maximum share price (USD)
  --gap-min <pct>      Minimum pre-market gap %
  --gap-max <pct>      Maximum pre-market gap %
  --change-min <pct>   Minimum regular-session change %
  --change-max <pct>   Maximum regular-session change %
  --rvol-min <ratio>   Minimum relative volume (today / 3-month avg). e.g. 2 = 2x
  --dollar-vol-min <usd>  Minimum dollar volume today (volume × price)
  --mcap-min <usd>     Minimum market cap (USD)
  --mcap-max <usd>     Maximum market cap (USD)
  --limit <n>          Cap on results after filtering (default 25, max 100)
  --offset <n>         Skip this many results before applying limit
  --json               Output JSON instead of a table
  --api-key <key>      Override API key
  --base-url <url>     Override API base URL
  --help               Show this message
`;

function asUniverse(value: string | undefined): ScreenUniverse | undefined {
  if (!value) return undefined;
  const upper = value.toUpperCase();
  if ((UNIVERSES as string[]).includes(upper)) return upper as ScreenUniverse;
  throw new Error(`screen: --universe must be one of ${UNIVERSES.join(', ')}`);
}

export async function runScreen(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(SCREEN_HELP);
    return EXIT.OK;
  }

  let filter: ScreenFilterOptions = {};
  try {
    const universe = asUniverse(getString(opts.args.flags, 'universe'));
    if (universe) filter.universe = universe;

    const numericFlags: Array<[string, keyof ScreenFilterOptions]> = [
      ['price-min', 'minPrice'],
      ['price-max', 'maxPrice'],
      ['gap-min', 'minGapPercent'],
      ['gap-max', 'maxGapPercent'],
      ['change-min', 'minChangePercent'],
      ['change-max', 'maxChangePercent'],
      ['rvol-min', 'minRelativeVolume'],
      ['dollar-vol-min', 'minDollarVolume'],
      ['mcap-min', 'minMarketCap'],
      ['mcap-max', 'maxMarketCap'],
      ['limit', 'limit'],
      ['offset', 'offset'],
    ];
    for (const [flag, key] of numericFlags) {
      const v = getNumber(opts.args.flags, flag);
      if (v !== undefined) (filter as Record<string, number>)[key] = v;
    }
  } catch (err) {
    return usageError(err instanceof Error ? err.message : String(err));
  }

  return runCommand(async () => {
    const client = buildClient(opts.args);
    const result = await client.screen(filter);
    const data = unwrapResult(result);
    if (data === undefined) return EXIT.RUNTIME_ERROR;

    if (opts.json) {
      printJson(data);
      return EXIT.OK;
    }

    if (data.length === 0) {
      process.stdout.write('No matches.\n');
      return EXIT.OK;
    }

    printTable<ScreenResult>(data, [
      { header: 'TICKER', get: (r) => r.ticker },
      { header: 'PRICE', align: 'right', get: (r) => fmtNum(r.price) },
      { header: 'PREV', align: 'right', get: (r) => fmtNum(r.previousClose) },
      { header: 'PRE', align: 'right', get: (r) => fmtNum(r.preMarketPrice) },
      { header: 'GAP%', align: 'right', get: (r) => fmtPct(r.gapPercent) },
      { header: 'RVOL', align: 'right', get: (r) => fmtNum(r.relativeVolume) },
      { header: 'CHG%', align: 'right', get: (r) => fmtPct(r.changePercent) },
      { header: 'STATE', get: (r) => r.marketState ?? '' },
    ]);
    return EXIT.OK;
  });
}
