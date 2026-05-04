import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCreditClient, diffSnapshots } from './credits.js';

describe('diffSnapshots', () => {
  it('returns null when either snapshot is null', () => {
    expect(diffSnapshots(null, { planUsed: 1, topupBalance: 0 })).toBeNull();
    expect(diffSnapshots({ planUsed: 1, topupBalance: 0 }, null)).toBeNull();
  });

  it('attributes plan-used delta as fromPlan', () => {
    const d = diffSnapshots({ planUsed: 100, topupBalance: 1000 }, { planUsed: 105, topupBalance: 1000 });
    expect(d).toEqual({ charged: 5, fromPlan: 5, fromTopup: 0 });
  });

  it('attributes topup balance drop as fromTopup', () => {
    const d = diffSnapshots({ planUsed: 0, topupBalance: 1000 }, { planUsed: 0, topupBalance: 970 });
    expect(d).toEqual({ charged: 30, fromPlan: 0, fromTopup: 30 });
  });

  it('sums plan + topup deltas in the same run', () => {
    const d = diffSnapshots({ planUsed: 50, topupBalance: 200 }, { planUsed: 60, topupBalance: 180 });
    expect(d).toEqual({ charged: 30, fromPlan: 10, fromTopup: 20 });
  });

  it('clamps negative deltas (month rollover, top-up reload)', () => {
    // planUsed went DOWN — month rolled over mid-run
    const d = diffSnapshots({ planUsed: 5000, topupBalance: 0 }, { planUsed: 10, topupBalance: 0 });
    expect(d).toEqual({ charged: 0, fromPlan: 0, fromTopup: 0 });
  });
});

describe('createCreditClient', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('reads planUsed from /api/v1/me and topupBalance from /api/v1/credits/balance', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/api/v1/me')) {
        return new Response(JSON.stringify({ plan: { usage: { monthly: 42 } } }), { status: 200 });
      }
      if (url.endsWith('/api/v1/credits/balance')) {
        return new Response(JSON.stringify({ topupBalanceCredits: 9999 }), { status: 200 });
      }
      throw new Error(`unexpected url: ${url}`);
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const client = createCreditClient({ baseUrl: 'http://test', apiKey: 'k' });
    const snap = await client.read();
    expect(snap).toEqual({ planUsed: 42, topupBalance: 9999 });
  });

  it('returns 0 topupBalance when balance endpoint 4xxs (anon org without x402)', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/api/v1/me')) {
        return new Response(JSON.stringify({ plan: { usage: { monthly: 7 } } }), { status: 200 });
      }
      return new Response('forbidden', { status: 403 });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const client = createCreditClient({ baseUrl: 'http://test', apiKey: 'k' });
    const snap = await client.read();
    expect(snap).toEqual({ planUsed: 7, topupBalance: 0 });
  });

  it('returns null when /me fetch errors', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('network down');
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const client = createCreditClient({ baseUrl: 'http://test', apiKey: 'k' });
    expect(await client.read()).toBeNull();
  });
});
