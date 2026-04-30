import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';

import { loginClaudeOAuth, refreshClaudeOAuthToken } from './claude-oauth.js';

const here = dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = join(here, '..', '.cache', 'anthropic-oauth.json');

interface CachedToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export type AnthropicCredentials = { kind: 'apiKey'; apiKey: string } | { kind: 'oauth'; authToken: string };

// Mirrors what Claude Code itself sends; required for OAuth bearer auth.
export const OAUTH_HEADERS = {
  'anthropic-beta': 'claude-code-20250219,oauth-2025-04-20,prompt-caching-2024-07-31',
  'user-agent': 'claude-cli/2.1.119',
  'x-app': 'cli',
};

async function readCached(): Promise<CachedToken | null> {
  try {
    const text = await readFile(TOKEN_FILE, 'utf-8');
    return JSON.parse(text) as CachedToken;
  } catch {
    return null;
  }
}

async function writeCached(token: CachedToken): Promise<void> {
  // Bearer + refresh tokens — keep readable only by the owner on shared hosts.
  await mkdir(dirname(TOKEN_FILE), { recursive: true, mode: 0o700 });
  await writeFile(TOKEN_FILE, JSON.stringify(token, null, 2), { encoding: 'utf-8', mode: 0o600 });
  await chmod(TOKEN_FILE, 0o600);
}

function ask(message: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(message, (a) => {
      rl.close();
      resolve(a.trim());
    });
  });
}

async function loginInteractive(): Promise<CachedToken> {
  const result = await loginClaudeOAuth({
    onAuth: async ({ url }) => {
      console.log('Open this URL in your browser to authorize:');
      console.log(url);
    },
    onPrompt: async ({ message }) => ask(`${message}: `),
    onProgress: (m) => console.log(`[oauth] ${m}`),
  });
  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresAt: result.expiresIn ? Date.now() + result.expiresIn * 1000 : undefined,
  };
}

export async function getAnthropicCredentials(): Promise<AnthropicCredentials> {
  const envKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (envKey) return { kind: 'apiKey', apiKey: envKey };

  // Long-lived OAuth bearer token (`claude setup-token`), same env var Yojin uses.
  const envOAuth = process.env.CLAUDE_CODE_OAUTH_TOKEN?.trim();
  if (envOAuth) return { kind: 'oauth', authToken: envOAuth };

  let cached = await readCached();
  // Refresh 60s before nominal expiry to avoid races with in-flight requests.
  const REFRESH_BUFFER_MS = 60_000;
  if (cached?.expiresAt && cached.expiresAt - REFRESH_BUFFER_MS < Date.now()) {
    if (!cached.refreshToken) {
      // Expired and unrefreshable — drop so the caller falls through to interactive login or env-var error.
      cached = null;
    } else {
      try {
        const refreshed = await refreshClaudeOAuthToken(cached.refreshToken);
        cached = {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken ?? cached.refreshToken,
          expiresAt: refreshed.expiresIn ? Date.now() + refreshed.expiresIn * 1000 : undefined,
        };
        await writeCached(cached);
      } catch {
        cached = null;
      }
    }
  }

  if (!cached) {
    if (!process.stdin.isTTY) {
      throw new Error(
        'No ANTHROPIC_API_KEY or CLAUDE_CODE_OAUTH_TOKEN set and no cached OAuth token. Set one of those env vars or run interactively to complete OAuth login.',
      );
    }
    cached = await loginInteractive();
    await writeCached(cached);
  }

  return { kind: 'oauth', authToken: cached.accessToken };
}
