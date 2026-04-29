import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAnthropicCredentials } from './anthropic-auth.js';

describe('anthropic-auth', () => {
  let savedKey: string | undefined;
  let savedOAuth: string | undefined;

  beforeEach(() => {
    savedKey = process.env.ANTHROPIC_API_KEY;
    savedOAuth = process.env.CLAUDE_CODE_OAUTH_TOKEN;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.CLAUDE_CODE_OAUTH_TOKEN;
  });

  afterEach(() => {
    if (savedKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = savedKey;
    if (savedOAuth === undefined) delete process.env.CLAUDE_CODE_OAUTH_TOKEN;
    else process.env.CLAUDE_CODE_OAUTH_TOKEN = savedOAuth;
  });

  it('returns env-var API key when ANTHROPIC_API_KEY is set', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    const creds = await getAnthropicCredentials();
    expect(creds).toEqual({ kind: 'apiKey', apiKey: 'sk-ant-test' });
  });

  it('returns OAuth token when CLAUDE_CODE_OAUTH_TOKEN is set', async () => {
    process.env.CLAUDE_CODE_OAUTH_TOKEN = 'sk-ant-oat01-test';
    const creds = await getAnthropicCredentials();
    expect(creds).toEqual({ kind: 'oauth', authToken: 'sk-ant-oat01-test' });
  });

  it('prefers ANTHROPIC_API_KEY over CLAUDE_CODE_OAUTH_TOKEN when both set', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    process.env.CLAUDE_CODE_OAUTH_TOKEN = 'sk-ant-oat01-test';
    const creds = await getAnthropicCredentials();
    expect(creds).toEqual({ kind: 'apiKey', apiKey: 'sk-ant-test' });
  });
});
