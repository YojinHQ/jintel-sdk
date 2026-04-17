import type { EntityType } from '@yojinhq/jintel-client';
import { getNumber, getString } from '../args.js';
import { buildClient, EXIT, type CommandOptions, type ExitCode, runCommand, unwrapResult, usageError } from '../common.js';
import { printJson, printTable } from '../format.js';

const VALID_TYPES: readonly EntityType[] = ['COMPANY', 'PERSON', 'CRYPTO', 'COMMODITY', 'INDEX'];

export const SEARCH_HELP = `Usage: jintel search <query> [flags]

Search entities (companies, crypto, people, etc.) by name or ticker.

Flags:
  --type <type>     Restrict results: ${VALID_TYPES.join(', ')}
  --limit <n>       Max results
  --json            Output JSON instead of a table
  --api-key <key>   Override API key
  --base-url <url>  Override API base URL
  --help            Show this message
`;

function isEntityType(v: string): v is EntityType {
  return (VALID_TYPES as readonly string[]).includes(v.toUpperCase());
}

export async function runSearch(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(SEARCH_HELP);
    return EXIT.OK;
  }

  const query = opts.args.positionals.slice(1).join(' ').trim();
  if (!query) {
    return usageError('search: query is required');
  }

  const typeFlag = getString(opts.args.flags, 'type');
  const limit = getNumber(opts.args.flags, 'limit');
  let type: EntityType | undefined;
  if (typeFlag) {
    const upper = typeFlag.toUpperCase();
    if (!isEntityType(upper)) {
      return usageError(`search: invalid --type "${typeFlag}" (expected one of ${VALID_TYPES.join(', ')})`);
    }
    type = upper;
  }

  return runCommand(async () => {
    const client = buildClient(opts.args);
    const searchOpts: { type?: EntityType; limit?: number } = {};
    if (type) searchOpts.type = type;
    if (limit !== undefined) searchOpts.limit = limit;
    const result = await client.searchEntities(query, searchOpts);
    const data = unwrapResult(result);
    if (data === undefined) return EXIT.RUNTIME_ERROR;

    if (opts.json) {
      printJson(data);
      return EXIT.OK;
    }

    printTable(data, [
      { header: 'ID', get: (e) => e.id },
      { header: 'NAME', get: (e) => e.name },
      { header: 'TYPE', get: (e) => e.type },
      { header: 'TICKERS', get: (e) => (e.tickers ?? []).join(',') },
      { header: 'COUNTRY', get: (e) => e.country ?? '' },
    ]);
    return EXIT.OK;
  });
}
