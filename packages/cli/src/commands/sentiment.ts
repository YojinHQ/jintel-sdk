import {
  EXIT,
  type CommandOptions,
  type ExitCode,
  runSubGraphCommand,
  usageError,
} from "../common.js";

export const SENTIMENT_HELP = `Usage: jintel sentiment <ticker> [flags]

Aggregated social sentiment for an entity — Reddit / Twitter mentions, upvotes,
24h momentum. Scalar snapshot. Output is JSON.

Flags:
  --api-key <key>    Override API key
  --base-url <url>   Override API base URL
  --help             Show this message
`;

export async function runSentiment(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(SENTIMENT_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("sentiment: ticker is required");
  return runSubGraphCommand(opts, ticker, "sentiment", undefined);
}
