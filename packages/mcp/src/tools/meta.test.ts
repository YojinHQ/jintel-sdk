import { describe, expect, it, vi } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildLoadBundleTool } from './meta.js';
import type { BundleName } from './types.js';

type SendToolListChanged = Pick<McpServer, 'sendToolListChanged'>;

function fakeServer() {
  const sendToolListChanged = vi.fn();
  const server: SendToolListChanged = { sendToolListChanged };
  // Cast to McpServer at call site — test only exercises sendToolListChanged
  return { server: server as unknown as McpServer, sendToolListChanged };
}

describe('jintel_load_bundle', () => {
  it('has bundle="core" and an enum of valid bundle names', () => {
    const { server } = fakeServer();
    const tool = buildLoadBundleTool({
      server,
      activeBundles: new Set<BundleName>(['core']),
      emitListChanged: true,
      staticMode: false,
    });
    expect(tool.name).toBe('jintel_load_bundle');
    expect(tool.bundle).toBe('core');
    const props = tool.inputSchema.properties as Record<string, { enum?: string[] }>;
    expect(props['name']?.enum).toEqual([
      'markets',
      'ownership',
      'corporate',
      'regulatory',
      'macro',
      'qualitative',
      'enrich',
    ]);
  });

  it('description includes catalog of bundles', () => {
    const { server } = fakeServer();
    const tool = buildLoadBundleTool({
      server,
      activeBundles: new Set<BundleName>(['core']),
      emitListChanged: true,
      staticMode: false,
    });
    expect(tool.description).toContain('markets');
    expect(tool.description).toContain('regulatory');
    expect(tool.description).toContain('jintel_query');
  });

  it('dynamic mode: load mutates state and calls sendToolListChanged', async () => {
    const { server, sendToolListChanged } = fakeServer();
    const active = new Set<BundleName>(['core']);
    const tool = buildLoadBundleTool({
      server,
      activeBundles: active,
      emitListChanged: true,
      staticMode: false,
    });

    const result = await tool.handler({ name: 'regulatory' });
    expect(result.isError).toBeFalsy();
    expect(active.has('regulatory')).toBe(true);
    expect(sendToolListChanged).toHaveBeenCalledTimes(1);
    expect(result.content[0]?.text).toContain('regulatory');
  });

  it('static mode: returns canned message, does NOT mutate, does NOT notify', async () => {
    const { server, sendToolListChanged } = fakeServer();
    const active = new Set<BundleName>(['core', 'markets', 'regulatory']);
    const tool = buildLoadBundleTool({
      server,
      activeBundles: active,
      emitListChanged: false,
      staticMode: true,
    });

    const result = await tool.handler({ name: 'macro' });
    expect(result.isError).toBeFalsy();
    expect(active.has('macro')).toBe(false);
    expect(sendToolListChanged).not.toHaveBeenCalled();
    expect(result.content[0]?.text).toContain('JINTEL_TOOLSET');
  });

  it('rejects unknown bundle with isError + valid list', async () => {
    const { server } = fakeServer();
    const tool = buildLoadBundleTool({
      server,
      activeBundles: new Set<BundleName>(['core']),
      emitListChanged: true,
      staticMode: false,
    });
    const result = await tool.handler({ name: 'bogus' });
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('unknown bundle');
    expect(result.content[0]?.text).toContain('regulatory');
  });

  it('idempotent: loading an already-active bundle does not re-fire notification', async () => {
    const { server, sendToolListChanged } = fakeServer();
    const tool = buildLoadBundleTool({
      server,
      activeBundles: new Set<BundleName>(['core', 'regulatory']),
      emitListChanged: true,
      staticMode: false,
    });

    const result = await tool.handler({ name: 'regulatory' });
    expect(result.isError).toBeFalsy();
    expect(sendToolListChanged).not.toHaveBeenCalled();
    expect(result.content[0]?.text).toContain('already');
  });
});
