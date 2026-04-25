import {
  JintelAuthError,
  JintelClient,
  JintelError,
  JintelUnreachableError,
  JintelValidationError,
  type EnrichOptions,
  type EnrichmentField,
  type Entity,
  type JintelResult,
} from "@yojinhq/jintel-client";
import { getBool, getString, type ParsedArgs } from "./args.js";
import { MissingApiKeyError, resolveConfig } from "./config.js";
import { printJson } from "./format.js";

/** Exit codes used by every command. */
export const EXIT = {
  OK: 0,
  RUNTIME_ERROR: 1,
  USAGE_ERROR: 2,
  AUTH_ERROR: 3,
} as const;

export type ExitCode = (typeof EXIT)[keyof typeof EXIT];

export interface CommandOptions {
  json: boolean;
  help: boolean;
  args: ParsedArgs;
}

export function extractCommonFlags(args: ParsedArgs): CommandOptions {
  return {
    json: getBool(args.flags, "json"),
    help: getBool(args.flags, "help", "h"),
    args,
  };
}

/**
 * Build a client using --api-key/--base-url flags and env/config fallbacks.
 * Throws `MissingApiKeyError` (caught by the command wrapper) when unresolved.
 */
export function buildClient(args: ParsedArgs): JintelClient {
  const flagKey = getString(args.flags, "api-key");
  const flagUrl = getString(args.flags, "base-url");
  const { apiKey, baseUrl } = resolveConfig(flagKey, flagUrl);
  return new JintelClient({ apiKey, baseUrl });
}

/**
 * Wrap a command's async execution, mapping client errors to exit codes and
 * writing friendly messages to stderr. Never throws.
 */
export async function runCommand(
  fn: () => Promise<ExitCode>,
): Promise<ExitCode> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      process.stderr.write(`jintel: ${err.message}\n`);
      return EXIT.AUTH_ERROR;
    }
    if (err instanceof JintelAuthError) {
      process.stderr.write(`jintel: auth error: ${err.message}\n`);
      return EXIT.AUTH_ERROR;
    }
    if (err instanceof JintelUnreachableError) {
      process.stderr.write(`jintel: API unreachable: ${err.message}\n`);
      return EXIT.RUNTIME_ERROR;
    }
    if (err instanceof JintelValidationError) {
      process.stderr.write(`jintel: validation error: ${err.message}\n`);
      return EXIT.RUNTIME_ERROR;
    }
    if (err instanceof JintelError) {
      process.stderr.write(`jintel: ${err.message}\n`);
      return EXIT.RUNTIME_ERROR;
    }
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`jintel: error: ${msg}\n`);
    return EXIT.RUNTIME_ERROR;
  }
}

/**
 * Unwrap a `JintelResult` from the client. On failure, writes the error to
 * stderr and returns `undefined` so the caller can `return EXIT.RUNTIME_ERROR`.
 */
export function unwrapResult<T>(result: JintelResult<T>): T | undefined {
  if (!result.success) {
    process.stderr.write(`jintel: ${result.error}\n`);
    return undefined;
  }
  return result.data;
}

export function usageError(message: string): ExitCode {
  process.stderr.write(`jintel: ${message}\n`);
  return EXIT.USAGE_ERROR;
}

/** Parse an ASC/DESC string flag (case-insensitive). Returns undefined for any other value. */
export function parseSort(raw: string | undefined): "ASC" | "DESC" | undefined {
  if (raw === undefined) return undefined;
  const upper = raw.toUpperCase();
  return upper === "ASC" || upper === "DESC" ? upper : undefined;
}

/** Parse a typed enum flag against an allowed list (case-sensitive). */
export function parseEnum<T extends string>(
  raw: string | undefined,
  allowed: readonly T[],
): T | undefined {
  if (raw === undefined) return undefined;
  return allowed.includes(raw as T) ? (raw as T) : undefined;
}

/**
 * Narrow a list of strings to those allowed by an enum. Returns `undefined` when
 * the input is undefined; returns `undefined` when nothing matches (caller
 * surfaces a usage error).
 */
export function filterEnumList<T extends string>(
  values: string[] | undefined,
  allowed: readonly T[],
): T[] | undefined {
  if (!values) return undefined;
  const filtered = values.filter((v): v is T =>
    (allowed as readonly string[]).includes(v),
  );
  return filtered.length > 0 ? filtered : undefined;
}

/**
 * Run a sub-graph CLI command — fetch one EnrichmentField for a ticker, with
 * optional per-field filter, and print the slice as JSON.
 *
 * The output shape mirrors the MCP `fetchSubGraph` helper: `{ id, tickers, data }`.
 */
export async function runSubGraphCommand<K extends EnrichmentField>(
  opts: CommandOptions,
  ticker: string,
  field: K,
  options: EnrichOptions | undefined,
): Promise<ExitCode> {
  return runCommand(async () => {
    const client = buildClient(opts.args);
    const result = await client.enrichEntity(ticker, [field], options);
    const entity = unwrapResult(result);
    if (entity === undefined) return EXIT.RUNTIME_ERROR;
    printJson({
      id: entity.id,
      tickers: entity.tickers ?? null,
      data: entity[field as keyof Entity],
    });
    return EXIT.OK;
  });
}
