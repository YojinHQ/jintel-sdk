import { describe, expect, it } from 'vitest';
import { BUNDLE_NAMES, DOMAIN_BUNDLE_NAMES, type BundleName, type ToolDefinition } from './types.js';

describe('BUNDLE_NAMES', () => {
  it('contains exactly core + 7 domain bundles', () => {
    expect(BUNDLE_NAMES).toEqual([
      'core',
      'markets',
      'ownership',
      'corporate',
      'regulatory',
      'macro',
      'qualitative',
      'enrich',
    ]);
  });

  it('BundleName accepts all listed bundles at the type level', () => {
    const ok: BundleName[] = [
      'core',
      'markets',
      'ownership',
      'corporate',
      'regulatory',
      'macro',
      'qualitative',
      'enrich',
    ];
    expect(ok).toHaveLength(8);
  });

  it('ToolDefinition shape requires a bundle field', () => {
    const t: ToolDefinition = {
      name: 'x',
      bundle: 'core',
      description: 'd',
      inputSchema: { type: 'object' },
      handler: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
    };
    expect(t.bundle).toBe('core');
  });
});

describe('DOMAIN_BUNDLE_NAMES', () => {
  it('is BUNDLE_NAMES minus "core"', () => {
    expect(DOMAIN_BUNDLE_NAMES).toHaveLength(BUNDLE_NAMES.length - 1);
    expect(DOMAIN_BUNDLE_NAMES).not.toContain('core');
    for (const name of DOMAIN_BUNDLE_NAMES) {
      expect(BUNDLE_NAMES).toContain(name);
    }
  });
});
