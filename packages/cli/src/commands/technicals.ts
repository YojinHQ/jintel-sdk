import {
  EXIT,
  type CommandOptions,
  type ExitCode,
  runSubGraphCommand,
  usageError,
} from "../common.js";

export const TECHNICALS_HELP = `Usage: jintel technicals <ticker> [flags]

Technical indicators for an entity — RSI, MACD, Bollinger Bands, EMA (10/50/200),
SMA (20/50/200), 52-WMA, ATR, VWMA, VWAP, MFI, ADX, Stochastic, OBV, Parabolic
SAR, Williams %R, and crossover flags. Output is JSON.

Flags:
  --api-key <key>    Override API key
  --base-url <url>   Override API base URL
  --help             Show this message
`;

export async function runTechnicals(opts: CommandOptions): Promise<ExitCode> {
  if (opts.help) {
    process.stdout.write(TECHNICALS_HELP);
    return EXIT.OK;
  }
  const ticker = opts.args.positionals[1];
  if (!ticker) return usageError("technicals: ticker is required");
  return runSubGraphCommand(opts, ticker, "technicals", undefined);
}
