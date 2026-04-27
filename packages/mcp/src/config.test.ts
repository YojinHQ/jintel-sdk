import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

const ORIG = { ...process.env };

beforeEach(() => {
  delete process.env.JINTEL_API_KEY;
  delete process.env.JINTEL_WALLET_PRIVATE_KEY;
  delete process.env.JINTEL_X402_MAX_VALUE;
  delete process.env.JINTEL_BASE_URL;
});

afterEach(() => {
  process.env = { ...ORIG };
});

const VALID_KEY = `0x${'a'.repeat(64)}`;

describe('loadConfig', () => {
  it('throws when neither JINTEL_API_KEY nor JINTEL_WALLET_PRIVATE_KEY is set', () => {
    expect(() => loadConfig()).toThrow(/JINTEL_API_KEY.*JINTEL_WALLET_PRIVATE_KEY/);
  });

  it('returns apiKey mode when JINTEL_API_KEY is set', () => {
    process.env.JINTEL_API_KEY = 'jk_live_test';
    const cfg = loadConfig();
    expect(cfg.auth.kind).toBe('apiKey');
    if (cfg.auth.kind === 'apiKey') expect(cfg.auth.apiKey).toBe('jk_live_test');
  });

  it('returns wallet mode when only JINTEL_WALLET_PRIVATE_KEY is set', () => {
    process.env.JINTEL_WALLET_PRIVATE_KEY = VALID_KEY;
    const cfg = loadConfig();
    expect(cfg.auth.kind).toBe('wallet');
    if (cfg.auth.kind === 'wallet') {
      expect(cfg.auth.walletPrivateKey).toBe(VALID_KEY);
      expect(cfg.auth.maxValueAtomic).toBe(1_000_000n);
    }
  });

  it('honors JINTEL_X402_MAX_VALUE override', () => {
    process.env.JINTEL_WALLET_PRIVATE_KEY = VALID_KEY;
    process.env.JINTEL_X402_MAX_VALUE = '5000000';
    const cfg = loadConfig();
    if (cfg.auth.kind !== 'wallet') throw new Error('expected wallet');
    expect(cfg.auth.maxValueAtomic).toBe(5_000_000n);
  });

  it('rejects malformed wallet keys', () => {
    process.env.JINTEL_WALLET_PRIVATE_KEY = 'not-hex';
    expect(() => loadConfig()).toThrow(/0x-prefixed 32-byte hex/);
  });

  it('rejects negative or non-numeric JINTEL_X402_MAX_VALUE', () => {
    process.env.JINTEL_WALLET_PRIVATE_KEY = VALID_KEY;
    process.env.JINTEL_X402_MAX_VALUE = '-1';
    expect(() => loadConfig()).toThrow(/positive integer/);
    process.env.JINTEL_X402_MAX_VALUE = 'abc';
    expect(() => loadConfig()).toThrow(/positive integer/);
  });

  it('apiKey wins when both JINTEL_API_KEY and JINTEL_WALLET_PRIVATE_KEY are set', () => {
    process.env.JINTEL_API_KEY = 'jk_live_test';
    process.env.JINTEL_WALLET_PRIVATE_KEY = VALID_KEY;
    const cfg = loadConfig();
    expect(cfg.auth.kind).toBe('apiKey');
  });

  it('passes through JINTEL_BASE_URL', () => {
    process.env.JINTEL_API_KEY = 'jk_live_test';
    process.env.JINTEL_BASE_URL = 'http://localhost:4000/api';
    const cfg = loadConfig();
    expect(cfg.baseUrl).toBe('http://localhost:4000/api');
  });
});
