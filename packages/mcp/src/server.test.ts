import { describe, expect, it } from 'vitest';
import { resolveMode, DEFAULT_DYNAMIC_CLIENTS, describeAuthMode } from './server.js';

describe('resolveMode', () => {
  it('JINTEL_TOOLSET=all forces static + all bundles + no list_changed', () => {
    const r = resolveMode({ toolset: 'all', dynamicClients: undefined, clientName: 'anything' });
    expect(r.mode).toBe('static');
    expect(r.emitListChanged).toBe(false);
    expect(r.activeBundles.has('core')).toBe(true);
    expect(r.activeBundles.has('markets')).toBe(true);
    expect(r.activeBundles.has('enrich')).toBe(true);
  });

  it('JINTEL_TOOLSET=core forces dynamic, core only at boot', () => {
    const r = resolveMode({ toolset: 'core', dynamicClients: undefined, clientName: 'anything' });
    expect(r.mode).toBe('dynamic');
    expect(r.emitListChanged).toBe(true);
    expect(Array.from(r.activeBundles)).toEqual(['core']);
  });

  it('JINTEL_TOOLSET=core,markets,regulatory forces static + named subset', () => {
    const r = resolveMode({
      toolset: 'core,markets,regulatory',
      dynamicClients: undefined,
      clientName: 'foo',
    });
    expect(r.mode).toBe('static');
    expect(r.emitListChanged).toBe(false);
    expect(Array.from(r.activeBundles).sort()).toEqual(['core', 'markets', 'regulatory']);
  });

  it('JINTEL_TOOLSET="dynamic" forces dynamic regardless of client', () => {
    const r = resolveMode({ toolset: 'dynamic', dynamicClients: undefined, clientName: 'random' });
    expect(r.mode).toBe('dynamic');
    expect(Array.from(r.activeBundles)).toEqual(['core']);
  });

  it('JINTEL_TOOLSET unset + allowlisted client → dynamic', () => {
    const r = resolveMode({ toolset: undefined, dynamicClients: undefined, clientName: 'claude-ai' });
    expect(r.mode).toBe('dynamic');
    expect(r.emitListChanged).toBe(true);
    expect(Array.from(r.activeBundles)).toEqual(['core']);
  });

  it('JINTEL_TOOLSET unset + unknown client → static-all', () => {
    const r = resolveMode({ toolset: undefined, dynamicClients: undefined, clientName: 'langchain-bridge' });
    expect(r.mode).toBe('static');
    expect(r.emitListChanged).toBe(false);
    expect(r.activeBundles.has('regulatory')).toBe(true);
  });

  it('JINTEL_TOOLSET unset + missing clientName → static-all', () => {
    const r = resolveMode({ toolset: undefined, dynamicClients: undefined, clientName: undefined });
    expect(r.mode).toBe('static');
    expect(r.emitListChanged).toBe(false);
  });

  it('matches allowlist case-insensitively as substring', () => {
    expect(resolveMode({ toolset: undefined, dynamicClients: undefined, clientName: 'Claude' }).mode).toBe('dynamic');
    expect(resolveMode({ toolset: undefined, dynamicClients: undefined, clientName: 'claude-ai-desktop' }).mode).toBe(
      'dynamic',
    );
    expect(resolveMode({ toolset: undefined, dynamicClients: undefined, clientName: 'CursorIDE' }).mode).toBe(
      'dynamic',
    );
  });

  it('JINTEL_DYNAMIC_CLIENTS overrides the default allowlist', () => {
    const r = resolveMode({
      toolset: undefined,
      dynamicClients: 'my-bridge,internal-agent',
      clientName: 'my-bridge',
    });
    expect(r.mode).toBe('dynamic');
    const r2 = resolveMode({
      toolset: undefined,
      dynamicClients: 'my-bridge',
      clientName: 'claude-ai',
    });
    expect(r2.mode).toBe('static'); // claude-ai is NOT in custom allowlist
  });

  it('rejects unknown bundle names in JINTEL_TOOLSET with a thrown error', () => {
    expect(() =>
      resolveMode({ toolset: 'core,bogus', dynamicClients: undefined, clientName: 'any' }),
    ).toThrow(/unknown bundle/);
  });

  it('exports DEFAULT_DYNAMIC_CLIENTS containing claude-ai and cursor', () => {
    expect(DEFAULT_DYNAMIC_CLIENTS).toContain('claude-ai');
    expect(DEFAULT_DYNAMIC_CLIENTS).toContain('cursor');
    expect(DEFAULT_DYNAMIC_CLIENTS).toContain('cline');
  });
});

describe('describeAuthMode', () => {
  it('returns "apiKey" for apiKey auth', () => {
    const result = describeAuthMode({
      auth: { kind: 'apiKey', apiKey: 'test-key' },
      baseUrl: undefined,
    });
    expect(result).toBe('apiKey');
  });

  it('returns wallet description with max value for wallet auth', () => {
    const result = describeAuthMode({
      auth: {
        kind: 'wallet',
        walletPrivateKey: `0x${'a'.repeat(64)}` as `0x${string}`,
        maxValueAtomic: 1_000_000n,
      },
      baseUrl: undefined,
    });
    expect(result).toBe('wallet (x402, max=1000000 atomic USDC)');
  });
});
