import { afterEach, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ToolListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';
import { createJintelMcpServer } from './server.js';

const TOTAL_TOOLS = 42; // 41 domain tools + jintel_load_bundle

describe('dynamic mode integration', () => {
  afterEach(() => {
    delete process.env.JINTEL_TOOLSET;
    delete process.env.JINTEL_DYNAMIC_CLIENTS;
  });

  it('loads regulatory bundle and sees new tools after list_changed', async () => {
    delete process.env.JINTEL_TOOLSET;
    delete process.env.JINTEL_DYNAMIC_CLIENTS;

    const { server } = createJintelMcpServer({
      auth: { kind: 'apiKey', apiKey: 'jk_test_dummy' },
    });

    const client = new Client({ name: 'claude-ai', version: 'test' }, { capabilities: {} });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);

    // 1) Initial tools/list — should be exactly 6 (core + load_bundle).
    const first = await client.listTools();
    const firstNames = new Set(first.tools.map((t) => t.name));
    expect(firstNames).toEqual(
      new Set([
        'jintel_search',
        'jintel_quote',
        'jintel_financials',
        'jintel_news',
        'jintel_query',
        'jintel_load_bundle',
      ]),
    );

    // 2) Subscribe to list_changed — resolve the promise on delivery.
    let changes = 0;
    let notify!: () => void;
    const notification = new Promise<void>((resolve) => {
      notify = resolve;
    });
    client.setNotificationHandler(ToolListChangedNotificationSchema, async () => {
      changes++;
      notify();
    });

    // 3) Call jintel_load_bundle.
    const loadResult = await client.callTool({
      name: 'jintel_load_bundle',
      arguments: { name: 'regulatory' },
    });
    expect(loadResult.isError).toBeFalsy();

    // Wait for the notification to be actually delivered.
    await notification;
    expect(changes).toBe(1);

    // 4) Refetch tools — regulatory should be present.
    const second = await client.listTools();
    const secondNames = new Set(second.tools.map((t) => t.name));
    expect(secondNames.has('jintel_litigation')).toBe(true);
    expect(secondNames.has('jintel_fda_events')).toBe(true);
    expect(secondNames.has('jintel_sanctions_screen')).toBe(true);

    // 5) Tool not in any loaded bundle → bundle_not_loaded error.
    const denied = await client.callTool({
      name: 'jintel_gdp',
      arguments: {},
    });
    expect(denied.isError).toBe(true);
    expect((denied.content as Array<{ text: string }>)[0]!.text).toContain('bundle_not_loaded');

    await client.close();
    await server.close();
  });
});

describe('static-all mode integration', () => {
  afterEach(() => {
    delete process.env.JINTEL_TOOLSET;
    delete process.env.JINTEL_DYNAMIC_CLIENTS;
  });

  it('exposes all 42 tools to a non-allowlisted client and never fires list_changed', async () => {
    delete process.env.JINTEL_TOOLSET;
    delete process.env.JINTEL_DYNAMIC_CLIENTS;

    const { server } = createJintelMcpServer({
      auth: { kind: 'apiKey', apiKey: 'jk_test_dummy' },
    });

    const client = new Client({ name: 'unknown-bridge', version: 'test' }, { capabilities: {} });
    const [c, s] = InMemoryTransport.createLinkedPair();
    await Promise.all([client.connect(c), server.connect(s)]);

    let changes = 0;
    client.setNotificationHandler(
      ToolListChangedNotificationSchema,
      async () => {
        changes++;
      },
    );

    const list = await client.listTools();
    expect(list.tools.length).toBe(TOTAL_TOOLS);

    // load_bundle in static mode returns a canned message, no notification.
    const r = await client.callTool({
      name: 'jintel_load_bundle',
      arguments: { name: 'regulatory' },
    });
    expect(r.isError).toBeFalsy();
    expect((r.content as Array<{ text: string }>)[0]!.text).toContain('JINTEL_TOOLSET');

    // Static mode never fires list_changed — assert immediately, no wait needed.
    expect(changes).toBe(0);

    await client.close();
    await server.close();
  });

  it('JINTEL_TOOLSET=core,markets exposes only those bundles', async () => {
    process.env.JINTEL_TOOLSET = 'core,markets';

    const { server } = createJintelMcpServer({
      auth: { kind: 'apiKey', apiKey: 'jk_test_dummy' },
    });
    const client = new Client({ name: 'claude-ai', version: 'test' }, { capabilities: {} });
    const [c, s] = InMemoryTransport.createLinkedPair();
    await Promise.all([client.connect(c), server.connect(s)]);

    const list = await client.listTools();
    const names = new Set(list.tools.map((t) => t.name));
    expect(names.has('jintel_quote')).toBe(true);
    expect(names.has('jintel_price_history')).toBe(true);
    expect(names.has('jintel_litigation')).toBe(false);
    expect(names.has('jintel_gdp')).toBe(false);

    delete process.env.JINTEL_TOOLSET;
    await client.close();
    await server.close();
  });
});
