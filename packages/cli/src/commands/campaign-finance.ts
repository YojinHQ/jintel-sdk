import { getNumber } from '../args.js';
import { buildClient, EXIT, type CommandOptions, type ExitCode, runCommand, unwrapResult, usageError } from '../common.js';
import { printJson, printTable } from '../format.js';

export const CAMPAIGN_FINANCE_HELP = `Usage: jintel campaign-finance <name> [flags]

Fetch PAC/committee data by name.

Flags:
  --cycle <year>    Election cycle (e.g. 2024)
  --json            Output JSON instead of a table
  --api-key <key>   Override API key
  --base-url <url>  Override API base URL
  --help            Show this message
`;

export async function runCampaignFinance(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(CAMPAIGN_FINANCE_HELP);
    return EXIT.OK;
  }

  const name = opts.args.positionals.slice(1).join(' ').trim();
  if (!name) {
    return usageError('campaign-finance: name is required');
  }
  const cycle = getNumber(opts.args.flags, 'cycle');

  return runCommand(async () => {
    const client = buildClient(opts.args);
    const result = await client.campaignFinance(name, cycle);
    const data = unwrapResult(result);
    if (data === undefined) return EXIT.RUNTIME_ERROR;

    if (opts.json) {
      printJson(data);
      return EXIT.OK;
    }

    printTable(data, [
      { header: 'ID', get: (c) => c.id },
      { header: 'NAME', get: (c) => c.name },
      { header: 'PARTY', get: (c) => c.party ?? '' },
      { header: 'TYPE', get: (c) => c.type ?? '' },
      { header: 'STATE', get: (c) => c.state ?? '' },
      { header: 'RAISED', align: 'right', get: (c) => c.totalRaised ?? '' },
      { header: 'SPENT', align: 'right', get: (c) => c.totalSpent ?? '' },
      { header: 'CYCLE', align: 'right', get: (c) => c.cycle ?? '' },
    ]);
    return EXIT.OK;
  });
}
