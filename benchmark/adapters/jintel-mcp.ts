import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import type { Adapter, AnthropicClientToolDef } from './types.js';

export interface JintelMcpOptions {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export async function createJintelMcpAdapter(opts: JintelMcpOptions): Promise<Adapter> {
  const client = new Client({ name: 'jintel-benchmark', version: '0.1.0' }, { capabilities: {} });
  const transport = new StdioClientTransport({
    command: opts.command,
    args: opts.args,
    env: opts.env,
  });
  // First-run cold-start can take 30-60s while npx fetches the MCP package and
  // its dep tree. Bump both timeouts well above the SDK's 60s default.
  const COLD_START_TIMEOUT_MS = 5 * 60 * 1000;
  await client.connect(transport, { timeout: COLD_START_TIMEOUT_MS });

  const listed = await client.listTools(undefined, { timeout: COLD_START_TIMEOUT_MS });
  const toolDefs: AnthropicClientToolDef[] = (listed.tools ?? []).map((t) => ({
    name: t.name,
    description: t.description ?? '',
    input_schema: (t.inputSchema as AnthropicClientToolDef['input_schema']) ?? {
      type: 'object',
      properties: {},
    },
  }));

  return {
    variant: 'jintel-mcp',
    toolsForAnthropic() {
      return toolDefs;
    },
    async invoke(call) {
      const start = Date.now();
      try {
        const result = await client.callTool({
          name: call.name,
          arguments: (call.input ?? {}) as Record<string, unknown>,
        });
        return {
          content: result.content,
          is_error: result.isError === true,
          latency_ms: Date.now() - start,
        };
      } catch (err) {
        return {
          content: `Error: ${(err as Error).message}`,
          is_error: true,
          latency_ms: Date.now() - start,
        };
      }
    },
    toolsSystemPromptFragment() {
      const names = toolDefs.map((t) => t.name).join(', ');
      return `You have access to Jintel tools: ${names}. Use them to retrieve facts.`;
    },
    async close() {
      await client.close();
    },
  };
}
