import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { JintelClient } from '@yojinhq/jintel-client';
import type { McpConfig } from './config.js';
import { buildTools, type ToolDefinition } from './tools.js';

export interface ServerHandle {
  server: Server;
  tools: ToolDefinition[];
}

export function createJintelMcpServer(config: McpConfig): ServerHandle {
  const client = new JintelClient({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
  });

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

export async function startStdioServer(config: McpConfig): Promise<void> {
  const { server, tools } = createJintelMcpServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `[jintel-mcp] ready — ${tools.length} tools registered, base=${config.baseUrl ?? 'default'}`,
  );
}
