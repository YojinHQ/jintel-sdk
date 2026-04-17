#!/usr/bin/env node
import { loadConfig } from './config.js';
import { startStdioServer } from './server.js';

async function main(): Promise<void> {
  const config = loadConfig();
  await startStdioServer(config);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  // MCP uses stdout for JSON-RPC — log to stderr only.
  console.error(`[jintel-mcp] fatal: ${message}`);
  process.exit(1);
});
