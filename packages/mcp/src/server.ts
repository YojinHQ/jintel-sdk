import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { JintelClient, type JintelFetch } from '@yojinhq/jintel-client';
import { wrapFetchWithPayment, createSigner } from 'x402-fetch';
import type { McpConfig } from './config.js';
import { buildTools, type ToolDefinition } from './tools.js';

export interface ServerHandle {
  server: Server;
  tools: ToolDefinition[];
}

export function createJintelMcpServer(config: McpConfig): ServerHandle {
  const client = buildClient(config);

  const tools = buildTools(client);
  const toolsByName = new Map<string, ToolDefinition>(tools.map((t) => [t.name, t]));

  const server = new Server(
    {
      name: '@yojinhq/jintel-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params;
    const tool = toolsByName.get(name);
    if (!tool) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }
    try {
      const result = await tool.handler(args ?? {});
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Never crash on a tool error — surface as isError.
      console.error(`[jintel-mcp] tool '${name}' threw:`, message);
      return {
        content: [{ type: 'text', text: message }],
        isError: true,
      };
    }
  });

  return { server, tools };
}

function buildClient(config: McpConfig): JintelClient {
  if (config.auth.kind === 'apiKey') {
    return new JintelClient({ apiKey: config.auth.apiKey, baseUrl: config.baseUrl });
  }
  // x402 v2 wallet mode — pay per query in USDC on Base. The server's
  // 402 → sign EIP-3009 → retry handshake is handled inside
  // `wrapFetchWithPayment`; we just hand it a signer and a max-spend cap.
  // `createSigner` is async (the package supports Solana wallets too), so
  // build the signer lazily on the first call to keep this function sync.
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

function describeAuthMode(config: McpConfig): string {
  if (config.auth.kind === 'apiKey') return 'apiKey';
  return `wallet (x402, max=${config.auth.maxValueAtomic} atomic USDC)`;
}

export async function startStdioServer(config: McpConfig): Promise<void> {
  const { server, tools } = createJintelMcpServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `[jintel-mcp] ready — ${tools.length} tools registered, ` +
      `auth=${describeAuthMode(config)}, base=${config.baseUrl ?? 'default'}`,
  );
}
