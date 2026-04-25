import {
  EXIT,
  type CommandOptions,
  type ExitCode,
  runSubGraphCommand,
  usageError,
} from "../common.js";

export const ANALYST_CONSENSUS_HELP = `Usage: jintel analyst-consensus <ticker> [flags]

Wall Street analyst consensus — recommendation, price target, EPS / revenue
estimates, number of analysts. Output is JSON.

Flags:
  --api-key <key>    Override API key
  --base-url <url>   Override API base URL
  --help             Show this message
`;

export async function runAnalystConsensus(
  opts: CommandOptions,
): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(ANALYST_CONSENSUS_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("analyst-consensus: ticker is required");
  return runSubGraphCommand(opts, ticker, "analyst", undefined);
}
