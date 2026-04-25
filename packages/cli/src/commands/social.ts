import {
  EXIT,
  type CommandOptions,
  type ExitCode,
  runSubGraphCommand,
  usageError,
} from "../common.js";

export const SOCIAL_HELP = `Usage: jintel social <ticker> [flags]

Raw social signals for an entity — recent Reddit posts, Twitter mentions, top
comments. Output is JSON.

Flags:
  --api-key <key>    Override API key
  --base-url <url>   Override API base URL
  --help             Show this message
`;

export async function runSocial(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(SOCIAL_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("social: ticker is required");
  return runSubGraphCommand(opts, ticker, "social", undefined);
}
