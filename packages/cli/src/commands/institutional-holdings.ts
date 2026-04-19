import { getNumber, getString } from '../args.js';
import { buildClient, EXIT, type CommandOptions, type ExitCode, runCommand, unwrapResult, usageError } from '../common.js';
import { printJson, printTable } from '../format.js';

export const INSTITUTIONAL_HOLDINGS_HELP = `Usage: jintel institutional-holdings <cik> [flags]

Fetch SEC Form 13F holdings for a filer by CIK.

Flags:
  --since <iso>      Only holdings reported on/after this ISO 8601 date
  --until <iso>      Only holdings reported on/before this ISO 8601 date
  --limit <n>        Max rows (default 20)
  --offset <n>       Skip N rows for pagination (default 0)
  --sort <ASC|DESC>  Sort direction (default DESC)
  --min-value <n>    Only holdings with value >= N (thousands of USD)
  --cusip <cusip>    Only holdings matching this CUSIP
  --json             Output JSON instead of a table
  --api-key <key>    Override API key
  --base-url <url>   Override API base URL
  --help             Show this message
`;

export async function runInstitutionalHoldings(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(INSTITUTIONAL_HOLDINGS_HELP);
    return EXIT.OK;
  }

  const cik = opts.args.positionals[1];
  if (!cik) {
    return usageError('institutional-holdings: CIK is required');
  }

  const since = getString(opts.args.flags, 'since');
  const until = getString(opts.args.flags, 'until');
  const limit = getNumber(opts.args.flags, 'limit');
  const offset = getNumber(opts.args.flags, 'offset');
  const minValue = getNumber(opts.args.flags, 'min-value');
  const cusip = getString(opts.args.flags, 'cusip');
  const sortRaw = getString(opts.args.flags, 'sort');
  let sort: 'ASC' | 'DESC' | undefined;
  if (sortRaw) {
    const upper = sortRaw.toUpperCase();
    if (upper !== 'ASC' && upper !== 'DESC') {
      return usageError('institutional-holdings: --sort must be ASC or DESC');
    }
    sort = upper;
  }

  const filter: {
    since?: string;
    until?: string;
    limit?: number;
    offset?: number;
    sort?: 'ASC' | 'DESC';
    minValue?: number;
    cusip?: string;
  } = {};
  if (since) filter.since = since;
  if (until) filter.until = until;
  if (limit !== undefined) filter.limit = limit;
  if (offset !== undefined) filter.offset = offset;
  if (minValue !== undefined) filter.minValue = minValue;
  if (cusip) filter.cusip = cusip;
  if (sort) filter.sort = sort;
  const hasFilter = Object.keys(filter).length > 0;

  return runCommand(async () => {
    const client = buildClient(opts.args);
    const result = await client.institutionalHoldings(cik, hasFilter ? filter : undefined);
    const data = unwrapResult(result);
    if (data === undefined) return EXIT.RUNTIME_ERROR;

    if (opts.json) {
      printJson(data);
      return EXIT.OK;
    }

    printTable(data, [
      { header: 'ISSUER', get: (h) => h.issuerName },
      { header: 'CUSIP', get: (h) => h.cusip },
      { header: 'CLASS', get: (h) => h.titleOfClass },
      { header: 'VALUE (000)', align: 'right', get: (h) => h.value },
      { header: 'SHARES', align: 'right', get: (h) => h.shares },
      { header: 'UNIT', get: (h) => h.sharesOrPrincipal },
      { header: 'DISCRETION', get: (h) => h.investmentDiscretion },
    ]);
    return EXIT.OK;
  });
}
