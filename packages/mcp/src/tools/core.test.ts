import { describe, expect, it, vi } from 'vitest';
import type { JintelClient } from '@yojinhq/jintel-client';
import { buildCoreTools } from './core.js';

function fakeClient() {
  return {
    enrichEntity: vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'abc',
        tickers: ['MSFT'],
        financials: { income: [], balanceSheet: [], cashFlow: [] },
      },
    }),
    searchEntities: vi.fn(),
    quotes: vi.fn(),
  } as unknown as JintelClient;
}

describe('jintel_financials field projection', () => {
  it('omits fields → handler invokes client without error', async () => {
    const client = fakeClient();
    const tool = buildCoreTools(client).find((t) => t.name === 'jintel_financials')!;
    const result = await tool.handler({ ticker: 'MSFT' });
    expect(result.isError).toBeFalsy();
    expect(client.enrichEntity).toHaveBeenCalledTimes(1);
  });

  it('valid fields → projection trims response to only requested keys', async () => {
    const client = fakeClient();
    const tool = buildCoreTools(client).find((t) => t.name === 'jintel_financials')!;
    // Mock returns financials with income rows that have extra fields
    (client.enrichEntity as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
      data: {
        id: 'abc',
        tickers: ['MSFT'],
        financials: {
          income: [{ totalRevenue: 200000, netIncome: 50000, grossProfit: 100000 }],
          balanceSheet: [],
          cashFlow: [],
        },
      },
    });
    const result = await tool.handler({ ticker: 'MSFT', fields: ['totalRevenue', 'netIncome'] });
    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0]!.text);
    const incomeRow = parsed.data.income[0];
    expect(Object.keys(incomeRow).sort()).toEqual(['netIncome', 'totalRevenue']);
    expect('grossProfit' in incomeRow).toBe(false);
  });

  it('unknown field → error result, client not called', async () => {
    const client = fakeClient();
    const tool = buildCoreTools(client).find((t) => t.name === 'jintel_financials')!;
    const result = await tool.handler({ ticker: 'MSFT', fields: ['bogus'] });
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('unknown field "bogus"');
    expect(client.enrichEntity).not.toHaveBeenCalled();
  });
});
