import { getString } from '../args.js';
import { buildClient, EXIT, type CommandOptions, type ExitCode, runCommand, unwrapResult, usageError } from '../common.js';
import { fmtNum, printJson, printTable } from '../format.js';

export const SANCTIONS_HELP = `Usage: jintel sanctions <name> [flags]

Screen a name against sanctions lists.

Flags:
  --country <code>  ISO country code to refine the search
  --json            Output JSON instead of a table
  --api-key <key>   Override API key
  --base-url <url>  Override API base URL
  --help            Show this message
`;

export async function runSanctions(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(SANCTIONS_HELP);
    return EXIT.OK;
  }

  const name = opts.args.positionals.slice(1).join(' ').trim();
  if (!name) {
    return usageError('sanctions: name is required');
  }

  const country = getString(opts.args.flags, 'country');

  return runCommand(async () => {
    const client = buildClient(opts.args);
    const result = await client.sanctionsScreen(name, country);
    const data = unwrapResult(result);
    if (data === undefined) return EXIT.RUNTIME_ERROR;

    if (opts.json) {
      printJson(data);
      return EXIT.OK;
    }

    printTable(data, [
      { header: 'LIST', get: (m) => m.listName },
      { header: 'MATCH', get: (m) => m.matchedName },
      { header: 'SCORE', align: 'right', get: (m) => fmtNum(m.score) },
      { header: 'TYPE', get: (m) => m.sdnType ?? '' },
      { header: 'PROGRAMS', get: (m) => (m.programs ?? []).join(',') },
    ]);
    return EXIT.OK;
  });
}
