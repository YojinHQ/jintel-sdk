import { ALL_ENRICHMENT_FIELDS, type EnrichmentField } from '@yojinhq/jintel-client';
import { getString } from '../args.js';
import { buildClient, EXIT, type CommandOptions, type ExitCode, runCommand, unwrapResult, usageError } from '../common.js';
import { printJson } from '../format.js';

export const ENRICH_HELP = `Usage: jintel enrich <ticker> [flags]

Fetch a single enriched entity. Output is always JSON — sub-graph data is too
nested for a useful table.

Flags:
  --fields <list>   Comma-separated sub-graphs to include.
                    Default: all fields.
                    Available: ${ALL_ENRICHMENT_FIELDS.join(', ')}
  --json            (no-op; output is always JSON)
  --api-key <key>   Override API key
  --base-url <url>  Override API base URL
  --help            Show this message
`;

function isEnrichmentField(v: string): v is EnrichmentField {
  return (ALL_ENRICHMENT_FIELDS as readonly string[]).includes(v);
}

export async function runEnrich(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(ENRICH_HELP);
    return EXIT.OK;
  }

  const ticker = opts.args.positionals[1];
  if (!ticker) {
    return usageError('enrich: ticker is required');
  }

  const fieldsFlag = getString(opts.args.flags, 'fields');
  let fields: EnrichmentField[] | undefined;
  if (fieldsFlag) {
    const parts = fieldsFlag.split(',').map((p) => p.trim()).filter((p) => p.length > 0);
    const invalid = parts.filter((p) => !isEnrichmentField(p));
    if (invalid.length > 0) {
      return usageError(
        `enrich: invalid --fields value(s): ${invalid.join(', ')}. Valid: ${ALL_ENRICHMENT_FIELDS.join(', ')}`,
      );
    }
    fields = parts.filter(isEnrichmentField);
  }

  return runCommand(async () => {
    const client = buildClient(opts.args);
    const result = await client.enrichEntity(ticker, fields);
    const data = unwrapResult(result);
    if (data === undefined) return EXIT.RUNTIME_ERROR;
    printJson(data);
    return EXIT.OK;
  });
}
