import { describe, expect, it, vi } from 'vitest';
import type { JintelClient } from '@yojinhq/jintel-client';
import { buildOwnershipTools } from './ownership.js';

// ── Task 19: jintel_institutional_holdings field projection ─────────────────

function fakeClientHoldings() {
  return {
    institutionalHoldings: vi.fn().mockResolvedValue({
      success: true,
      data: [{ issuerName: 'APPLE INC', cusip: '037833100', value: 100000, shares: 500 }],
    }),
    enrichEntity: vi.fn().mockResolvedValue({
      success: true,
      data: { id: 'test', tickers: ['AAPL'], insiderTrades: [] },
    }),
  } as unknown as JintelClient;
}

describe('jintel_institutional_holdings field projection', () => {
  it('omits fields → handler invokes client, no error', async () => {
    const client = fakeClientHoldings();
    const tool = buildOwnershipTools(client).find(
      (t) => t.name === 'jintel_institutional_holdings',
    )!;
    const result = await tool.handler({ cik: '0001067983' });
    expect(result.isError).toBeFalsy();
    expect(
      (client.institutionalHoldings as ReturnType<typeof vi.fn>).mock.calls,
    ).toHaveLength(1);
  });

  it('valid fields → projection trims response to only requested keys', async () => {
    const client = fakeClientHoldings();
    const tool = buildOwnershipTools(client).find(
      (t) => t.name === 'jintel_institutional_holdings',
    )!;
    const result = await tool.handler({
      cik: '0001067983',
      fields: ['issuerName', 'value'],
    });
    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0]!.text);
    const row = parsed[0];
    expect(Object.keys(row).sort()).toEqual(['issuerName', 'value']);
    expect('cusip' in row).toBe(false);
    expect('shares' in row).toBe(false);
  });

  it('unknown field → error result, client not called', async () => {
    const client = fakeClientHoldings();
    const tool = buildOwnershipTools(client).find(
      (t) => t.name === 'jintel_institutional_holdings',
    )!;
    const result = await tool.handler({
      cik: '0001067983',
      fields: ['bogus'],
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('unknown field "bogus"');
    expect(client.institutionalHoldings).not.toHaveBeenCalled();
  });
});

// ── Task 20: jintel_insider_trades field projection ─────────────────────────

function fakeClientTrades() {
  return {
    institutionalHoldings: vi.fn().mockResolvedValue({ success: true, data: [] }),
    enrichEntity: vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'test',
        tickers: ['AAPL'],
        insiderTrades: [{ reporterName: 'Tim Cook', transactionDate: '2024-01-15', shares: 100 }],
      },
    }),
  } as unknown as JintelClient;
}

describe('jintel_insider_trades field projection', () => {
  it('omits fields → handler invokes client, no error', async () => {
    const client = fakeClientTrades();
    const tool = buildOwnershipTools(client).find(
      (t) => t.name === 'jintel_insider_trades',
    )!;
    const result = await tool.handler({ ticker: 'AAPL' });
    expect(result.isError).toBeFalsy();
    expect(
      (client.enrichEntity as ReturnType<typeof vi.fn>).mock.calls,
    ).toHaveLength(1);
  });

  it('valid fields → projection trims response to only requested keys', async () => {
    const client = fakeClientTrades();
    const tool = buildOwnershipTools(client).find(
      (t) => t.name === 'jintel_insider_trades',
    )!;
    const result = await tool.handler({
      ticker: 'AAPL',
      fields: ['reporterName', 'transactionDate'],
    });
    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0]!.text);
    const row = parsed.data[0];
    expect(Object.keys(row).sort()).toEqual(['reporterName', 'transactionDate']);
    expect('shares' in row).toBe(false);
  });

  it('unknown field → error result, client not called', async () => {
    const client = fakeClientTrades();
    const tool = buildOwnershipTools(client).find(
      (t) => t.name === 'jintel_insider_trades',
    )!;
    const result = await tool.handler({
      ticker: 'AAPL',
      fields: ['bogus'],
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('unknown field "bogus"');
    expect(client.enrichEntity).not.toHaveBeenCalled();
  });
});
