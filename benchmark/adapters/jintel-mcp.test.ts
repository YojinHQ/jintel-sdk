import { describe, it, expect, vi, beforeEach } from 'vitest';

const callToolMock = vi.fn();
const listToolsMock = vi.fn();
const closeMock = vi.fn();
const connectMock = vi.fn();

vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: class {
    connect = connectMock;
    callTool = callToolMock;
    listTools = listToolsMock;
    close = closeMock;
    constructor(_: unknown, __: unknown) {}
  },
}));

vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
  StdioClientTransport: class {
    constructor(_: unknown) {}
  },
}));

beforeEach(() => {
  callToolMock.mockReset();
  listToolsMock.mockReset();
  closeMock.mockReset();
  connectMock.mockReset();
});

describe('jintel-mcp adapter', () => {
  it('lists tools via the MCP client and exposes them as Anthropic tool defs', async () => {
    listToolsMock.mockResolvedValueOnce({
      tools: [
        {
          name: 'jintel_quote',
          description: 'Real-time quote',
          inputSchema: { type: 'object', properties: { ticker: { type: 'string' } }, required: ['ticker'] },
        },
      ],
    });
    const { createJintelMcpAdapter } = await import('./jintel-mcp.js');
    const a = await createJintelMcpAdapter({ command: 'echo', args: ['noop'] });
    expect(a.variant).toBe('jintel-mcp');
    const tools = a.toolsForAnthropic();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('jintel_quote');
  });

  it('invokes a tool via callTool and reports latency', async () => {
    listToolsMock.mockResolvedValueOnce({ tools: [] });
    callToolMock.mockResolvedValueOnce({ content: [{ type: 'text', text: '{"hits":1}' }] });
    const { createJintelMcpAdapter } = await import('./jintel-mcp.js');
    const a = await createJintelMcpAdapter({ command: 'echo' });
    const result = await a.invoke({ name: 'jintel_quote', input: { ticker: 'AAPL' } });
    expect(callToolMock).toHaveBeenCalledOnce();
    expect(result.is_error).toBe(false);
    expect(result.latency_ms).toBeGreaterThanOrEqual(0);
  });

  it('records is_error=true when callTool throws', async () => {
    listToolsMock.mockResolvedValueOnce({ tools: [] });
    callToolMock.mockRejectedValueOnce(new Error('connection refused'));
    const { createJintelMcpAdapter } = await import('./jintel-mcp.js');
    const a = await createJintelMcpAdapter({ command: 'echo' });
    const result = await a.invoke({ name: 'x', input: {} });
    expect(result.is_error).toBe(true);
    expect(String(result.content)).toMatch(/connection refused/);
  });

  it('close() closes the underlying client', async () => {
    listToolsMock.mockResolvedValueOnce({ tools: [] });
    const { createJintelMcpAdapter } = await import('./jintel-mcp.js');
    const a = await createJintelMcpAdapter({ command: 'echo' });
    await a.close?.();
    expect(closeMock).toHaveBeenCalledOnce();
  });
});
