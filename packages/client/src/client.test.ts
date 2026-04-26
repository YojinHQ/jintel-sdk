/**
 * Tests for `JintelClient.asOf` plumbing.
 *
 * Stubs `globalThis.fetch` so we can inspect the GraphQL variables the client
 * actually sends — that's the only place the `asOf` contract is observable
 * without a live server.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JintelClient } from './client.js';

interface CapturedRequest {
  url: string;
  body: { query: string; variables?: Record<string, unknown> };
}

let captured: CapturedRequest[] = [];

function stubResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  captured = [];
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    const body = init?.body ? (JSON.parse(init.body as string) as CapturedRequest['body']) : { query: '', variables: {} };
    captured.push({ url, body });
    // Return a generic empty payload — the methods under test only inspect
    // what they SEND, not what they get back, so the shape doesn't matter
    // beyond passing GraphQLResponseSchema.
    return stubResponse({ data: { quotes: [], entitiesByTickers: [], priceHistory: [], searchEntities: [] } });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('JintelClient asOf forwarding', () => {
  it('sends per-call asOf as a GraphQL variable on quotes()', async () => {
    const client = new JintelClient({ apiKey: 'test', baseUrl: 'http://x/api' });
    await client.quotes(['AAPL'], { asOf: '2023-08-15T00:00:00Z' });
    expect(captured).toHaveLength(1);
    expect(captured[0].body.variables?.asOf).toBe('2023-08-15T00:00:00Z');
    expect(captured[0].body.query).toContain('$asOf: String');
  });

  it('uses client-level default asOf when no per-call asOf is given', async () => {
    const client = new JintelClient({
      apiKey: 'test',
      baseUrl: 'http://x/api',
      asOf: '2022-01-01T00:00:00Z',
    });
    await client.quotes(['AAPL']);
    expect(captured[0].body.variables?.asOf).toBe('2022-01-01T00:00:00Z');
  });

  it('per-call asOf overrides client default', async () => {
    const client = new JintelClient({
      apiKey: 'test',
      baseUrl: 'http://x/api',
      asOf: '2022-01-01T00:00:00Z',
    });
    await client.quotes(['AAPL'], { asOf: '2024-06-01T00:00:00Z' });
    expect(captured[0].body.variables?.asOf).toBe('2024-06-01T00:00:00Z');
  });

  it('omits asOf variable entirely when neither default nor per-call is set', async () => {
    const client = new JintelClient({ apiKey: 'test', baseUrl: 'http://x/api' });
    await client.quotes(['AAPL']);
    expect(captured[0].body.variables?.asOf).toBeUndefined();
  });

  it('forwards asOf on batchEnrich() through buildBatchEnrichQuery', async () => {
    const client = new JintelClient({ apiKey: 'test', baseUrl: 'http://x/api' });
    await client.batchEnrich(['AAPL'], ['news'], { asOf: '2023-08-15T00:00:00Z' });
    expect(captured[0].body.query).toContain('$asOf: String');
    expect(captured[0].body.query).toContain('entitiesByTickers(tickers: $tickers, asOf: $asOf)');
    expect(captured[0].body.variables?.asOf).toBe('2023-08-15T00:00:00Z');
  });

  it('forwards asOf on priceHistory()', async () => {
    const client = new JintelClient({ apiKey: 'test', baseUrl: 'http://x/api' });
    await client.priceHistory(['AAPL'], '1y', '1d', { asOf: '2023-08-15T00:00:00Z' });
    expect(captured[0].body.variables?.asOf).toBe('2023-08-15T00:00:00Z');
  });

  it('forwards asOf on searchEntities()', async () => {
    const client = new JintelClient({ apiKey: 'test', baseUrl: 'http://x/api' });
    await client.searchEntities('apple', { asOf: '2023-08-15T00:00:00Z' });
    expect(captured[0].body.variables?.asOf).toBe('2023-08-15T00:00:00Z');
  });
});

describe('Auth modes', () => {
  it('throws when neither apiKey nor fetch is provided', () => {
    expect(() => new JintelClient({})).toThrow(/apiKey/);
    expect(() => new JintelClient()).toThrow(/apiKey/);
  });

  it('sends Authorization: Bearer when apiKey is configured', async () => {
    const seen: { headers?: Record<string, string> }[] = [];
    vi.stubGlobal('fetch', async (_url: string, init?: RequestInit) => {
      seen.push({ headers: init?.headers as Record<string, string> | undefined });
      return stubResponse({ data: { quotes: [] } });
    });
    const client = new JintelClient({ apiKey: 'jk_live_test', baseUrl: 'http://x/api' });
    await client.quotes(['AAPL']);
    expect(seen[0].headers?.Authorization).toBe('Bearer jk_live_test');
  });

  it('uses caller-supplied fetch when in x402 mode (no apiKey, no Authorization header)', async () => {
    const probes: { url: string; init?: RequestInit }[] = [];
    const customFetch: typeof fetch = async (url, init) => {
      probes.push({ url: String(url), init });
      return stubResponse({ data: { quotes: [] } });
    };
    const client = new JintelClient({ fetch: customFetch, baseUrl: 'http://x/api' });
    await client.quotes(['AAPL']);
    expect(probes).toHaveLength(1);
    const headers = probes[0].init?.headers as Record<string, string> | undefined;
    expect(headers?.Authorization).toBeUndefined();
    // The x402-aware fetch wrapper would attach PAYMENT-SIGNATURE itself —
    // we just verify the client doesn't clobber it.
  });

  it('prefers apiKey when both apiKey and custom fetch are supplied', async () => {
    const probes: { init?: RequestInit }[] = [];
    const customFetch: typeof fetch = async (_url, init) => {
      probes.push({ init });
      return stubResponse({ data: { quotes: [] } });
    };
    const client = new JintelClient({
      apiKey: 'jk_live_test',
      fetch: customFetch,
      baseUrl: 'http://x/api',
    });
    await client.quotes(['AAPL']);
    const headers = probes[0].init?.headers as Record<string, string> | undefined;
    expect(headers?.Authorization).toBe('Bearer jk_live_test');
  });
});

describe('Response cache isolates asOf buckets', () => {
  it('caches separately by asOf — live request and PIT request never share a slot', async () => {
    const client = new JintelClient({ apiKey: 'test', baseUrl: 'http://x/api', cache: true });
    await client.quotes(['AAPL']);
    await client.quotes(['AAPL'], { asOf: '2023-08-15T00:00:00Z' });
    // Both went out — neither was served from cache.
    expect(captured).toHaveLength(2);
  });

  it('caches PIT requests with the same asOf', async () => {
    const client = new JintelClient({ apiKey: 'test', baseUrl: 'http://x/api', cache: true });
    await client.quotes(['AAPL'], { asOf: '2023-08-15T00:00:00Z' });
    await client.quotes(['AAPL'], { asOf: '2023-08-15T00:00:00Z' });
    expect(captured).toHaveLength(1);
  });
});
