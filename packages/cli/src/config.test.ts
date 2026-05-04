import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { InvalidWalletKeyError, MissingCredentialsError, resolveConfig } from './config.js';

const ORIG_ENV = { ...process.env };
let fakeHome: string;

beforeAll(() => {
  // Redirect HOME so resolveConfig can never accidentally read a real
  // ~/.jintel/config.json on the developer's machine while these tests run.
  fakeHome = mkdtempSync(join(tmpdir(), 'jintel-cli-test-'));
});

afterAll(() => {
  rmSync(fakeHome, { recursive: true, force: true });
});

beforeEach(() => {
  delete process.env.JINTEL_API_KEY;
  delete process.env.JINTEL_WALLET_PRIVATE_KEY;
  delete process.env.JINTEL_X402_MAX_VALUE;
  delete process.env.JINTEL_API_URL;
  process.env.HOME = fakeHome;
});

afterEach(() => {
  process.env = { ...ORIG_ENV };
});

const VALID_KEY = `0x${'b'.repeat(64)}`;

describe('resolveConfig', () => {
  it('throws MissingCredentialsError when nothing is set', () => {
    expect(() => resolveConfig()).toThrow(MissingCredentialsError);
  });

  it('returns apiKey mode from --api-key flag', () => {
    const cfg = resolveConfig('jk_live_flag');
    expect(cfg.auth.kind).toBe('apiKey');
    if (cfg.auth.kind === 'apiKey') expect(cfg.auth.apiKey).toBe('jk_live_flag');
  });

  it('returns apiKey mode from JINTEL_API_KEY env', () => {
    process.env.JINTEL_API_KEY = 'jk_live_env';
    const cfg = resolveConfig();
    if (cfg.auth.kind !== 'apiKey') throw new Error('expected apiKey');
    expect(cfg.auth.apiKey).toBe('jk_live_env');
  });

  it('returns wallet mode from --wallet-key flag', () => {
    const cfg = resolveConfig(undefined, undefined, VALID_KEY);
    if (cfg.auth.kind !== 'wallet') throw new Error('expected wallet');
    expect(cfg.auth.walletPrivateKey).toBe(VALID_KEY);
    expect(cfg.auth.maxValueAtomic).toBe(1_000_000n);
  });

  it('returns wallet mode from JINTEL_WALLET_PRIVATE_KEY env', () => {
    process.env.JINTEL_WALLET_PRIVATE_KEY = VALID_KEY;
    const cfg = resolveConfig();
    if (cfg.auth.kind !== 'wallet') throw new Error('expected wallet');
    expect(cfg.auth.walletPrivateKey).toBe(VALID_KEY);
  });

  it('honors JINTEL_X402_MAX_VALUE in wallet mode', () => {
    process.env.JINTEL_WALLET_PRIVATE_KEY = VALID_KEY;
    process.env.JINTEL_X402_MAX_VALUE = '2500000';
    const cfg = resolveConfig();
    if (cfg.auth.kind !== 'wallet') throw new Error('expected wallet');
    expect(cfg.auth.maxValueAtomic).toBe(2_500_000n);
  });

  it('rejects malformed wallet keys', () => {
    expect(() => resolveConfig(undefined, undefined, '0xshort')).toThrow(InvalidWalletKeyError);
  });

  it('apiKey wins when both flags are present', () => {
    const cfg = resolveConfig('jk_live_flag', undefined, VALID_KEY);
    expect(cfg.auth.kind).toBe('apiKey');
  });

  it('flag overrides env in both modes', () => {
    process.env.JINTEL_API_KEY = 'jk_live_env';
    const cfg = resolveConfig('jk_live_flag');
    if (cfg.auth.kind !== 'apiKey') throw new Error('expected apiKey');
    expect(cfg.auth.apiKey).toBe('jk_live_flag');
  });

  it('passes through baseUrl', () => {
    const cfg = resolveConfig('jk_live_flag', 'http://localhost:4000/api');
    expect(cfg.baseUrl).toBe('http://localhost:4000/api');
  });
});
