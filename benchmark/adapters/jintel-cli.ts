import { existsSync, mkdtempSync, writeFileSync, chmodSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

import type { Adapter, AnthropicClientToolDef, ToolInvocation, ToolInvocationResult } from './types.js';

export interface JintelCliOptions {
  // When unset, falls back to `npx @yojinhq/jintel-cli`. JINTEL_CLI_BIN_PATH overrides for dev.
  binPath?: string;
  timeoutMs?: number;
  outputCap?: number;
}

const ENV_BIN_PATH = process.env.JINTEL_CLI_BIN_PATH;
const NPM_PACKAGE = '@yojinhq/jintel-cli';

function shellQuote(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

const AUTH_ENV_KEYS = [
  'JINTEL_API_KEY',
  'JINTEL_BASE_URL',
  'JINTEL_WALLET_PRIVATE_KEY',
  'JINTEL_X402_MAX_VALUE',
  'HOME',
] as const;

const TOOLS_SYSTEM_PROMPT = `\
You have a \`bash\` tool. Use it to invoke the \`jintel\` CLI and retrieve live financial data.

## Syntax
\`\`\`
jintel <command> [args] [flags]
\`\`\`
Most sub-graph commands always emit JSON (e.g. \`news\`, \`financials\`, \`risk-signals\`).
Core commands like \`quote\`, \`price-history\`, \`gdp\` emit a table by default and accept \`--json\` for machine-readable output.

## Output shape
\`jintel\` JSON commands emit \`{ id, tickers, data: { ... } }\`. Always drill into \`.data\` first.
Field names are camelCase: \`balanceSheet\` not \`balance_sheet\`, \`dilutedEps\` not \`diluted_eps\`.

## Output cap (CRITICAL)
Tool output is capped at **30 000 characters**. If you exceed it, the cap **slices mid-JSON**, which breaks every \`jq\`/\`json.load\` downstream. **Always pre-filter with \`jq\` inside the same command** — never \`| head\` raw JSON, never read unfiltered output. If a filter still overflows, narrow it (single record, single field, \`length\`).

## Discovery
- \`jintel list-tools\` — full JSON catalogue of every command and its flags.
- \`jintel <command> --help\` — one-command help with all available flags.

## Worked examples

### 1. Real-time quote
\`\`\`bash
jintel quote AAPL MSFT --json | jq '[.[] | {ticker, price, changePercent}]'
\`\`\`

### 2. Find a specific historical period (annual)
\`\`\`bash
jintel financials AAPL --period-types 12M --json \\
  | jq '.data.income[] | select(.periodEnding | startswith("2018")) | {periodEnding, dilutedEps, netIncome}'
\`\`\`

### 3. Find a specific historical period (quarterly)
\`\`\`bash
jintel financials AAPL --period-types 3M --json \\
  | jq '.data.income[] | select(.periodEnding | startswith("2018-09")) | {periodEnding, dilutedEps}'
\`\`\`

### 4. Sanctions / OFAC screening
\`\`\`bash
jintel sanctions "Huawei Technologies" --json | jq '.data.matches[0:3]'
\`\`\`

### 5. Price history with date range
\`\`\`bash
jintel price-history BTC-USD --from 2024-01-01 --to 2024-03-31 --json | jq '.["BTC-USD"] | length'
\`\`\`

### 6. Extract a single scalar — current S&P 500 P/E ratio
\`\`\`bash
jintel sp500-multiples pe --json | jq '.data.series[-1].value'
\`\`\`

Always extract the minimum data needed. For unknown flag names, consult \`jintel <command> --help\` first.
If a \`jq\` selector returns \`null\` or empty, inspect the structure with \`jq 'keys'\` or \`jq '.data | keys'\` (small, safe) before guessing again.`;

export function createJintelCliAdapter(opts: JintelCliOptions = {}): Adapter {
  const binPath = opts.binPath ?? ENV_BIN_PATH;
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const outputCap = opts.outputCap ?? 30_000;

  if (binPath && !existsSync(binPath)) {
    throw new Error(
      `[jintel-cli] CLI binary not found at ${binPath}. ` +
        `Unset JINTEL_CLI_BIN_PATH (and pass no binPath) to use the published ${NPM_PACKAGE} via npx, ` +
        `or point to a valid local bin.js.`,
    );
  }

  // Wrapper so the model can call `jintel ...` directly from $PATH.
  const tmpDir = mkdtempSync(join(tmpdir(), 'jintel-cli-'));
  const wrapperPath = join(tmpDir, 'jintel');
  const wrapperBody = binPath
    ? `#!/bin/sh\nexec node ${shellQuote(binPath)} "$@"\n`
    : `#!/bin/sh\nexec npx -y -p ${NPM_PACKAGE} jintel "$@"\n`;
  writeFileSync(wrapperPath, wrapperBody, 'utf-8');
  chmodSync(wrapperPath, 0o755);

  const bashTool: AnthropicClientToolDef = {
    name: 'bash',
    description:
      'Run a shell command in bash. Combined stdout+stderr returned. ' +
      'Output is capped at 30 000 chars — always pre-filter JSON with jq inside the command, ' +
      'because the cap slices mid-string and breaks downstream parsers.',
    input_schema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to execute.',
        },
      },
      required: ['command'],
    },
  };

  return {
    variant: 'jintel-cli',

    toolsForAnthropic() {
      return [bashTool];
    },

    toolsSystemPromptFragment() {
      return TOOLS_SYSTEM_PROMPT;
    },

    async invoke(call: ToolInvocation): Promise<ToolInvocationResult> {
      const start = Date.now();

      const input = call.input as Record<string, unknown>;
      const command = typeof input.command === 'string' ? input.command : '';

      const env: Record<string, string> = {};
      for (const key of AUTH_ENV_KEYS) {
        const v = process.env[key];
        if (v !== undefined) env[key] = v;
      }
      env.PATH = `${tmpDir}:${process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin'}`;

      return new Promise<ToolInvocationResult>((resolve) => {
        let output = '';
        let settled = false;

        const child = spawn('bash', ['-c', command], { env });

        const finish = (exitCode: number | null, signal: NodeJS.Signals | null) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);

          let content = output;
          if (content.length > outputCap) {
            const extra = content.length - outputCap;
            content =
              content.slice(0, outputCap) +
              `\n…(truncated, ${extra} more chars — output exceeded ${outputCap}-char cap. ` +
              `Re-run with a tighter \`jq\` filter (e.g. select a single record or fields) ` +
              `to avoid mid-JSON truncation that breaks downstream parsing.)`;
          }

          const is_error = exitCode !== 0 || signal !== null;
          // Anthropic API rejects tool_result with empty content when is_error=true.
          if (content.length === 0) {
            content = is_error
              ? `[jintel-cli] command exited with code ${exitCode ?? 'null'}${signal ? ` (signal ${signal})` : ''} and produced no output`
              : '[jintel-cli] command produced no output';
          }
          resolve({ content, is_error, latency_ms: Date.now() - start });
        };

        const timer = setTimeout(() => {
          if (!settled) {
            child.kill('SIGTERM');
            output += '\n[jintel-cli] Command timed out after ' + timeoutMs + 'ms';
            finish(null, 'SIGTERM');
          }
        }, timeoutMs);

        child.stdout.on('data', (chunk: Buffer) => {
          output += chunk.toString();
        });
        child.stderr.on('data', (chunk: Buffer) => {
          output += chunk.toString();
        });

        child.on('close', (code, signal) => finish(code, signal));
        child.on('error', (err) => {
          output += `\n[jintel-cli] spawn error: ${err.message}`;
          finish(1, null);
        });
      });
    },

    async close() {
      rmSync(tmpDir, { recursive: true, force: true });
    },
  };
}
