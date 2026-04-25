import {
  EXIT,
  type CommandOptions,
  type ExitCode,
  runSubGraphCommand,
  usageError,
} from "../common.js";

export const OWNERSHIP_HELP = `Usage: jintel ownership <ticker> [flags]

Ownership breakdown — institutional %, insider %, retail %, float, and shares
outstanding. Output is JSON.

Flags:
  --api-key <key>    Override API key
  --base-url <url>   Override API base URL
  --help             Show this message
`;

export async function runOwnership(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(OWNERSHIP_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("ownership: ticker is required");
  return runSubGraphCommand(opts, ticker, "ownership", undefined);
}
