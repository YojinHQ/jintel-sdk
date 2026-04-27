import { describe, expect, it, vi } from 'vitest';
import type { JintelClient } from '@yojinhq/jintel-client';
import { buildCorporateTools } from './corporate.js';

function fakeClient() {
  return {
    enrichEntity: vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'ent_test',
        tickers: ['AAPL'],
        segmentedRevenue: [{ segment: 'iPhone', value: 100, dimension: 'PRODUCT' }],
      },
    }),
  } as unknown as JintelClient;
}

describe('jintel_segmented_revenue field projection', () => {
  it('omits fields → handler invokes client without error', async () => {
    const client = fakeClient();
    const tool = buildCorporateTools(client).find(
      (t) => t.name === 'jintel_segmented_revenue',
    )!;
    const result = await tool.handler({ ticker: 'AAPL' });
    expect(result.isError).toBeFalsy();
    expect(client.enrichEntity).toHaveBeenCalledTimes(1);
  });

  it('valid fields → projection trims response to only requested keys', async () => {
    const client = fakeClient();
    const tool = buildCorporateTools(client).find(
      (t) => t.name === 'jintel_segmented_revenue',
    )!;
    const result = await tool.handler({
      ticker: 'AAPL',
      fields: ['segment', 'value'],
    });
    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0]!.text);
    const row = parsed.data[0];
    expect(Object.keys(row).sort()).toEqual(['segment', 'value']);
    expect('dimension' in row).toBe(false);
  });

  it('unknown field → error result, client not called', async () => {
    const client = fakeClient();
    const tool = buildCorporateTools(client).find(
      (t) => t.name === 'jintel_segmented_revenue',
    )!;
    const result = await tool.handler({ ticker: 'AAPL', fields: ['bogus'] });
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('unknown field "bogus"');
    expect(client.enrichEntity).not.toHaveBeenCalled();
  });
});
