/**
 * Tests for x402 v2 payment-required handling.
 *
 * Asserts the SDK's two new contracts:
 *   1. `apiKey` is no longer required when a custom `fetch` is provided —
 *      callers can wrap fetch with `x402-fetch` to pay per query instead.
 *   2. HTTP 402 surfaces as `JintelPaymentRequiredError` with a parsed quote
 *      from the base64-encoded `PAYMENT-REQUIRED` response header.
 *
 * Wire format reference: https://api.jintel.ai/openapi.json (X402Quote schema).
 */

import { describe, it, expect } from 'vitest';
import { JintelClient, JintelAuthError, JintelPaymentRequiredError } from './client.js';
import type { X402Quote } from './types.js';

const SAMPLE_QUOTE: X402Quote = {
  x402Version: 2,
  resource: { url: 'https://api.jintel.ai/api/graphql', mimeType: 'application/json' },
  accepts: [
    {
      scheme: 'exact',
      network: 'eip155:8453',
      amount: '15000',
      asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      payTo: '0xbff6D68Bd9A8Bb5e677eF5ace6d9417d6d783671',
      maxTimeoutSeconds: 300,
    },
  ],
};

function encodeQuote(quote: X402Quote): string {
  const json = JSON.stringify(quote);
  // The sample quote is pure ASCII, so latin-1 `btoa` is sufficient and
  // avoids depending on `@types/node` for `Buffer`. `btoa` is a global in
  // Node ≥ 16 and all browsers.
  return btoa(json);
}

function payment402Response(quote: X402Quote): Response {
  return new Response('{}', {
    status: 402,
    headers: {
      'content-type': 'application/json',
      'payment-required': encodeQuote(quote),
    },
  });
}

describe('JintelClient construction', () => {
  it('throws when neither apiKey nor fetch is provided', () => {
    expect(() => new JintelClient({} as never)).toThrow(JintelAuthError);
  });

  it('accepts a custom fetch with no apiKey (x402-only mode)', () => {
    const myFetch = async () => new Response('{}', { status: 200 });
    expect(() => new JintelClient({ fetch: myFetch })).not.toThrow();
  });
});

describe('x402 payment-required handling', () => {
  it('skips Authorization header when no apiKey is configured', async () => {
    let sentHeaders: Headers | undefined;
    const client = new JintelClient({
      baseUrl: 'http://x/api',
      fetch: async (_url, init) => {
        sentHeaders = new Headers(init?.headers as HeadersInit | undefined);
        return new Response(JSON.stringify({ data: { quotes: [] } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      },
    });
    await client.quotes(['AAPL']);
    expect(sentHeaders?.has('authorization')).toBe(false);
  });

  it('still sends Bearer when apiKey is set even with custom fetch', async () => {
    let sentAuth: string | null = null;
    const client = new JintelClient({
      apiKey: 'test-key',
      baseUrl: 'http://x/api',
      fetch: async (_url, init) => {
        const headers = new Headers(init?.headers as HeadersInit | undefined);
        sentAuth = headers.get('authorization');
        return new Response(JSON.stringify({ data: { quotes: [] } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      },
    });
    await client.quotes(['AAPL']);
    expect(sentAuth).toBe('Bearer test-key');
  });

  it('throws JintelPaymentRequiredError on 402 with the parsed quote', async () => {
    const client = new JintelClient({
      baseUrl: 'http://x/api',
      fetch: async () => payment402Response(SAMPLE_QUOTE),
    });

    await expect(client.request('{ __typename }')).rejects.toMatchObject({
      name: 'JintelPaymentRequiredError',
      code: 'PAYMENT_REQUIRED',
    });

    try {
      await client.request('{ __typename }');
    } catch (err) {
      const e = err as JintelPaymentRequiredError;
      expect(e).toBeInstanceOf(JintelPaymentRequiredError);
      expect(e.quote?.x402Version).toBe(2);
      expect(e.quote?.accepts[0].network).toBe('eip155:8453');
      expect(e.quote?.accepts[0].asset).toBe(SAMPLE_QUOTE.accepts[0].asset);
      expect(e.paymentRequiredHeader).toBeTruthy();
    }
  });

  it('still throws JintelPaymentRequiredError when the header is missing or malformed', async () => {
    const client = new JintelClient({
      baseUrl: 'http://x/api',
      fetch: async () =>
        new Response('{}', {
          status: 402,
          headers: { 'content-type': 'application/json', 'payment-required': 'not-base64-json' },
        }),
    });

    try {
      await client.request('{ __typename }');
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(JintelPaymentRequiredError);
      const e = err as JintelPaymentRequiredError;
      expect(e.quote).toBeUndefined();
      expect(e.paymentRequiredHeader).toBe('not-base64-json');
    }
  });
});
