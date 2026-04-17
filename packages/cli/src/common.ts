import {
  JintelAuthError,
  JintelClient,
  JintelError,
  JintelUnreachableError,
  JintelValidationError,
  type JintelResult,
} from '@yojinhq/jintel-client';
import { getBool, getString, type ParsedArgs } from './args.js';
import { MissingApiKeyError, resolveConfig } from './config.js';

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
    json: getBool(args.flags, 'json'),
    help: getBool(args.flags, 'help', 'h'),
    args,
  };
}

/**
 * Build a client using --api-key/--base-url flags and env/config fallbacks.
 * Throws `MissingApiKeyError` (caught by the command wrapper) when unresolved.
 */
export function buildClient(args: ParsedArgs): JintelClient {
  const flagKey = getString(args.flags, 'api-key');
  const flagUrl = getString(args.flags, 'base-url');
  const { apiKey, baseUrl } = resolveConfig(flagKey, flagUrl);
  return new JintelClient({ apiKey, baseUrl });
}

/**
 * Wrap a command's async execution, mapping client errors to exit codes and
 * writing friendly messages to stderr. Never throws.
 */
export async function runCommand(fn: () => Promise<ExitCode>): Promise<ExitCode> {
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
