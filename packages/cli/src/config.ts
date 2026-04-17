import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface ResolvedConfig {
  apiKey: string;
  baseUrl?: string;
}

interface ConfigFile {
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Resolve credentials in precedence order:
 *   1. --api-key / --base-url CLI flags
 *   2. JINTEL_API_KEY / JINTEL_API_URL environment variables
 *   3. ~/.jintel/config.json file (`{ "apiKey": "...", "baseUrl": "..." }`)
 */
export function resolveConfig(flagApiKey?: string, flagBaseUrl?: string): ResolvedConfig {
  let fileConfig: ConfigFile = {};
  try {
    const path = join(homedir(), '.jintel', 'config.json');
    const raw = readFileSync(path, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      if (typeof obj.apiKey === 'string') fileConfig.apiKey = obj.apiKey;
      if (typeof obj.baseUrl === 'string') fileConfig.baseUrl = obj.baseUrl;
    }
  } catch {
    // no config file or unreadable — ignore
  }

  const envKey = process.env.JINTEL_API_KEY;
  const envUrl = process.env.JINTEL_API_URL;

  const apiKey = flagApiKey ?? (envKey && envKey.length > 0 ? envKey : undefined) ?? fileConfig.apiKey;
  const baseUrl = flagBaseUrl ?? (envUrl && envUrl.length > 0 ? envUrl : undefined) ?? fileConfig.baseUrl;

  if (!apiKey) {
    throw new MissingApiKeyError();
  }

  return { apiKey, baseUrl };
}

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      'No API key provided. Pass --api-key, set JINTEL_API_KEY, or add one to ~/.jintel/config.json.',
    );
    this.name = 'MissingApiKeyError';
  }
}
