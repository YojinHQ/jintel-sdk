/**
 * Auth modes supported by the MCP server.
 *
 *   - `apiKey` — Bearer auth against an org-issued API key (the established path).
 *   - `wallet` — keyless x402 v2: the server pays per query in USDC on Base by
 *     signing EIP-3009 authorizations with the supplied private key. Suitable
 *     for agent-native deployments (agentic.market, x402scan, etc.).
 *
 * Exactly one mode is selected at startup based on which env var is set.
 * `JINTEL_API_KEY` wins if both are present, since it's the stricter contract
 * (named org, plan limits) and an operator who set both probably wants Bearer
 * billing rather than burning USDC.
 */
export type McpAuthMode =
  | { kind: 'apiKey'; apiKey: string }
  | { kind: 'wallet'; walletPrivateKey: `0x${string}`; maxValueAtomic: bigint };

export interface McpConfig {
  auth: McpAuthMode;
  baseUrl?: string;
}

/** Default cap on a single x402 payment: 1 USDC (1_000_000 atomic units, 6 decimals). */
const DEFAULT_X402_MAX_VALUE_ATOMIC = 1_000_000n;

function parseHexPrivateKey(raw: string): `0x${string}` {
  const trimmed = raw.trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
    throw new Error(
      'JINTEL_WALLET_PRIVATE_KEY must be a 0x-prefixed 32-byte hex string (66 chars total)',
    );
  }
  return trimmed as `0x${string}`;
}

function parseMaxValueAtomic(raw: string | undefined): bigint {
  if (!raw || raw.trim() === '') return DEFAULT_X402_MAX_VALUE_ATOMIC;
  try {
    const n = BigInt(raw.trim());
    if (n <= 0n) throw new Error('must be positive');
    return n;
  } catch {
    throw new Error(
      `JINTEL_X402_MAX_VALUE must be a positive integer (atomic USDC, 6 decimals; e.g. 1000000 = $1)`,
    );
  }
}

export function loadConfig(): McpConfig {
  const apiKey = process.env.JINTEL_API_KEY?.trim();
  const walletKey = process.env.JINTEL_WALLET_PRIVATE_KEY?.trim();
  const baseUrlEnv = process.env.JINTEL_BASE_URL?.trim();
  const baseUrl = baseUrlEnv && baseUrlEnv.length > 0 ? baseUrlEnv : undefined;

  if (apiKey && apiKey.length > 0) {
    return { auth: { kind: 'apiKey', apiKey }, baseUrl };
  }

  if (walletKey && walletKey.length > 0) {
    return {
      auth: {
        kind: 'wallet',
        walletPrivateKey: parseHexPrivateKey(walletKey),
        maxValueAtomic: parseMaxValueAtomic(process.env.JINTEL_X402_MAX_VALUE),
      },
      baseUrl,
    };
  }

  throw new Error(
    'No Jintel credentials set. Set JINTEL_API_KEY for Bearer mode (https://api.jintel.ai), ' +
      'or JINTEL_WALLET_PRIVATE_KEY for x402 wallet mode (USDC on Base, ' +
      'optional JINTEL_X402_MAX_VALUE caps per-query spend in atomic units, default 1_000_000 = $1).',
  );
}
