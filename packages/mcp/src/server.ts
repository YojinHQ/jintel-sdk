import { BUNDLE_NAMES, type BundleName } from './tools/types.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { JintelClient, type JintelFetch } from '@yojinhq/jintel-client';
import { wrapFetchWithPayment, createSigner } from 'x402-fetch';
import type { McpConfig } from './config.js';
import { buildTools } from './tools/index.js';
import type { ToolDefinition } from './tools/types.js';

export interface ServerHandle {
  server: McpServer;
}

export function createJintelMcpServer(config: McpConfig): ServerHandle {
  const client = buildClient(config);

  const server = new McpServer(
    {
      name: '@yojinhq/jintel-mcp',
      version: '0.3.0',
    },
    {
      capabilities: {
        tools: { listChanged: true },
      },
    },
  );

  // Mode is resolved lazily, on the first tools/list request, by which time
  // `initialize` has completed and clientInfo is readable.
  let resolved: { activeBundles: Set<BundleName>; emitListChanged: boolean; staticMode: boolean } | null = null;
  let tools: ToolDefinition[] = [];
  let toolsByName: Map<string, ToolDefinition> = new Map();

  function ensureBuilt() {
    if (resolved !== null) return;
    const clientInfo = server.server.getClientVersion();
    const r = resolveMode({
      toolset: process.env.JINTEL_TOOLSET,
      dynamicClients: process.env.JINTEL_DYNAMIC_CLIENTS,
      clientName: clientInfo?.name,
    });
    resolved = {
      activeBundles: r.activeBundles,
      emitListChanged: r.emitListChanged,
      staticMode: r.mode === 'static',
    };
    tools = buildTools({
      client,
      server,
      activeBundles: resolved.activeBundles,
      emitListChanged: resolved.emitListChanged,
      staticMode: resolved.staticMode,
    });
    toolsByName = new Map(tools.map((t) => [t.name, t]));
    console.error(
      `[jintel-mcp] mode=${r.mode} bundles=[${Array.from(r.activeBundles).sort().join(',')}] ` +
        `client=${clientInfo?.name ?? 'unknown'}`,
    );
  }

  // We use the underlying server's setRequestHandler directly because our tools/list
  // is filtered by the active bundle set (dynamic mode) and tools/call enforces
  // bundle_not_loaded — McpServer.registerTool can't model that.
  server.server.setRequestHandler(ListToolsRequestSchema, async () => {
    ensureBuilt();
    const active = resolved!.activeBundles;
    return {
      tools: tools
        .filter((t) => active.has(t.bundle))
        .map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
    };
  });

  server.server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    ensureBuilt();
    const { name, arguments: args } = request.params;
    const tool = toolsByName.get(name);
    if (!tool) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }
    if (!resolved!.activeBundles.has(tool.bundle)) {
      return {
        content: [
          {
            type: 'text',
            text: `bundle_not_loaded: tool "${name}" is in bundle "${tool.bundle}" which is not active. Call jintel_load_bundle({name: "${tool.bundle}"}) first.`,
          },
        ],
        isError: true,
      };
    }
    try {
      const result = await tool.handler(args ?? {});
      return result as CallToolResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[jintel-mcp] tool '${name}' threw:`, message);
      return {
        content: [{ type: 'text', text: message }],
        isError: true,
      };
    }
  });

  return { server };
}

function buildClient(config: McpConfig): JintelClient {
  if (config.auth.kind === 'apiKey') {
    return new JintelClient({ apiKey: config.auth.apiKey, baseUrl: config.baseUrl });
  }
  // x402 wallet mode: `createSigner` is async (supports Solana too), so build
  // the wrapped fetch lazily on first call to keep this function sync.
  const auth = config.auth;
  let inner: ((input: RequestInfo, init?: RequestInit) => Promise<Response>) | undefined;
  const lazyFetch: JintelFetch = async (input, init) => {
    if (!inner) {
      const signer = await createSigner('base', auth.walletPrivateKey);
      inner = wrapFetchWithPayment(globalThis.fetch, signer, auth.maxValueAtomic);
    }
    return inner(input as RequestInfo, init);
  };
  return new JintelClient({ fetch: lazyFetch, baseUrl: config.baseUrl });
}

export function describeAuthMode(config: McpConfig): string {
  if (config.auth.kind === 'apiKey') return 'apiKey';
  return `wallet (x402, max=${config.auth.maxValueAtomic} atomic USDC)`;
}

export async function startStdioServer(config: McpConfig): Promise<void> {
  const { server } = createJintelMcpServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `[jintel-mcp] connected — auth=${describeAuthMode(config)}, base=${config.baseUrl ?? 'default'}`,
  );
}

export const DEFAULT_DYNAMIC_CLIENTS = [
  'claude-ai',
  'claude',
  'cursor',
  'cline',
  'mcp-inspector',
  'continue',
] as const;

export type Mode = 'dynamic' | 'static';

export interface ResolvedMode {
  mode: Mode;
  activeBundles: Set<BundleName>;
  emitListChanged: boolean;
}

export interface ResolveModeInput {
  toolset: string | undefined;
  dynamicClients: string | undefined;
  clientName: string | undefined;
}

const ALL_BUNDLES = new Set<BundleName>(BUNDLE_NAMES);

export function resolveMode(input: ResolveModeInput): ResolvedMode {
  const toolset = input.toolset?.trim();
  if (toolset) {
    if (toolset === 'all') {
      return { mode: 'static', activeBundles: new Set(BUNDLE_NAMES), emitListChanged: false };
    }
    if (toolset === 'dynamic') {
      return { mode: 'dynamic', activeBundles: new Set<BundleName>(['core']), emitListChanged: true };
    }
    const requested = toolset.split(',').map((s) => s.trim()).filter(Boolean);
    const bundles = new Set<BundleName>(['core']);
    for (const r of requested) {
      if (!ALL_BUNDLES.has(r as BundleName)) {
        throw new Error(`unknown bundle "${r}" in JINTEL_TOOLSET. valid: ${BUNDLE_NAMES.join(', ')}`);
      }
      bundles.add(r as BundleName);
    }
    if (requested.length === 1 && requested[0] === 'core') {
      return { mode: 'dynamic', activeBundles: bundles, emitListChanged: true };
    }
    return { mode: 'static', activeBundles: bundles, emitListChanged: false };
  }

  const allowlist = (input.dynamicClients ?? DEFAULT_DYNAMIC_CLIENTS.join(','))
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const name = input.clientName?.toLowerCase();
  const matches = name !== undefined && allowlist.some((n) => name.includes(n));
  if (matches) {
    return { mode: 'dynamic', activeBundles: new Set<BundleName>(['core']), emitListChanged: true };
  }
  return { mode: 'static', activeBundles: new Set(BUNDLE_NAMES), emitListChanged: false };
}
