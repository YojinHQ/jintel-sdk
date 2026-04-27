import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Auth modes the CLI supports.
 *
 *   - `apiKey` — Bearer auth (default for human users; resolved from
 *     `--api-key`, `JINTEL_API_KEY`, or `~/.jintel/config.json`).
 *   - `wallet` — keyless x402 v2 (USDC on Base). Resolved from
 *     `--wallet-key`, `JINTEL_WALLET_PRIVATE_KEY`, or `~/.jintel/config.json`.
 *     Optional spend cap via `JINTEL_X402_MAX_VALUE` (atomic units, default 1 USDC).
 */
export type AuthMode =
  | { kind: 'apiKey'; apiKey: string }
  | { kind: 'wallet'; walletPrivateKey: `0x${string}`; maxValueAtomic: bigint };

export interface ResolvedConfig {
  auth: AuthMode;
  baseUrl?: string;
}

interface ConfigFile {
  apiKey?: string;
  walletKey?: string;
  baseUrl?: string;
}

/** Default cap on a single x402 payment: 1 USDC (1_000_000 atomic units, 6 decimals). */
const DEFAULT_X402_MAX_VALUE_ATOMIC = 1_000_000n;

function parseHexPrivateKey(raw: string): `0x${string}` {
  const trimmed = raw.trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
    throw new InvalidWalletKeyError();
  }
  return trimmed as `0x${string}`;
}

function parseMaxValueAtomic(raw: string | undefined): bigint {
  if (!raw || raw.trim() === '') return DEFAULT_X402_MAX_VALUE_ATOMIC;
  try {
    const n = BigInt(raw.trim());
    if (n <= 0n) throw new Error('not positive');
    return n;
  } catch {
    throw new Error(
      'JINTEL_X402_MAX_VALUE must be a positive integer (atomic USDC, 6 decimals)',
    );
  }
}

/**
 * Resolve credentials in precedence order:
 *   1. --api-key / --wallet-key / --base-url CLI flags
 *   2. JINTEL_API_KEY / JINTEL_WALLET_PRIVATE_KEY / JINTEL_API_URL env vars
 *   3. ~/.jintel/config.json file (`{ "apiKey": "...", "walletKey": "0x...", "baseUrl": "..." }`)
 *
 * `apiKey` wins over `walletKey` when both are present — the operator who set
 * a Bearer key probably wants org-billed traffic, not on-chain spend.
 */
export function resolveConfig(
  flagApiKey?: string,
  flagBaseUrl?: string,
  flagWalletKey?: string,
): ResolvedConfig {
  let fileConfig: ConfigFile = {};
  try {
    const path = join(homedir(), '.jintel', 'config.json');
    const raw = readFileSync(path, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      if (typeof obj.apiKey === 'string') fileConfig.apiKey = obj.apiKey;
      if (typeof obj.walletKey === 'string') fileConfig.walletKey = obj.walletKey;
      if (typeof obj.baseUrl === 'string') fileConfig.baseUrl = obj.baseUrl;
    }
  } catch {
    // no config file or unreadable — ignore
  }

  const envKey = process.env.JINTEL_API_KEY;
  const envWallet = process.env.JINTEL_WALLET_PRIVATE_KEY;
  const envUrl = process.env.JINTEL_API_URL;

  const apiKey = flagApiKey ?? (envKey && envKey.length > 0 ? envKey : undefined) ?? fileConfig.apiKey;
  const walletKey =
    flagWalletKey ?? (envWallet && envWallet.length > 0 ? envWallet : undefined) ?? fileConfig.walletKey;
  const baseUrl = flagBaseUrl ?? (envUrl && envUrl.length > 0 ? envUrl : undefined) ?? fileConfig.baseUrl;

  if (apiKey) {
    return { auth: { kind: 'apiKey', apiKey }, baseUrl };
  }

  if (walletKey) {
    return {
      auth: {
        kind: 'wallet',
        walletPrivateKey: parseHexPrivateKey(walletKey),
        maxValueAtomic: parseMaxValueAtomic(process.env.JINTEL_X402_MAX_VALUE),
      },
      baseUrl,
    };
  }

  throw new MissingCredentialsError();
}

export class MissingCredentialsError extends Error {
  constructor() {
    super(
      'No credentials provided. Pass --api-key (or set JINTEL_API_KEY), ' +
        'or pass --wallet-key (or set JINTEL_WALLET_PRIVATE_KEY) for x402 wallet mode. ' +
        'You can also store either in ~/.jintel/config.json.',
    );
    this.name = 'MissingCredentialsError';
  }
}

export class InvalidWalletKeyError extends Error {
  constructor() {
    super('Wallet key must be a 0x-prefixed 32-byte hex string (66 chars total)');
    this.name = 'InvalidWalletKeyError';
  }
}

/** @deprecated Retained as an alias so legacy importers keep compiling. */
export const MissingApiKeyError = MissingCredentialsError;
