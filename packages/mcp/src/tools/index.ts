import type { JintelClient } from '@yojinhq/jintel-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildCoreTools } from './core.js';
import { buildMarketsTools } from './markets.js';
import { buildOwnershipTools } from './ownership.js';
import { buildCorporateTools } from './corporate.js';
import { buildRegulatoryTools } from './regulatory.js';
import { buildMacroTools } from './macro.js';
import { buildQualitativeTools } from './qualitative.js';
import { buildEnrichTools } from './enrich.js';
import { buildLoadBundleTool } from './meta.js';
import { stripPropertyDescriptions } from './schema-utils.js';
import type { ToolDefinition, BundleName } from './types.js';

// Property descriptions stripped from input schemas to save context, except these
// where the parameter semantics are non-obvious enough that the agent needs the hint.
const PRESERVED_DESCRIPTIONS = new Set<string>([
  'cycle',
  'asOf',
]);

export interface BuildToolsContext {
  client: JintelClient;
  server: McpServer;
  activeBundles: Set<BundleName>;
  emitListChanged: boolean;
  staticMode: boolean;
}

export function buildTools(ctx: BuildToolsContext): ToolDefinition[] {
  const raw: ToolDefinition[] = [
    ...buildCoreTools(ctx.client),
    buildLoadBundleTool({
      server: ctx.server,
      activeBundles: ctx.activeBundles,
      emitListChanged: ctx.emitListChanged,
      staticMode: ctx.staticMode,
    }),
    ...buildMarketsTools(ctx.client),
    ...buildOwnershipTools(ctx.client),
    ...buildCorporateTools(ctx.client),
    ...buildRegulatoryTools(ctx.client),
    ...buildMacroTools(ctx.client),
    ...buildQualitativeTools(ctx.client),
    ...buildEnrichTools(ctx.client),
  ];
  return raw.map((t) => ({
    ...t,
    inputSchema: stripPropertyDescriptions(t.inputSchema, PRESERVED_DESCRIPTIONS),
  }));
}

export type { ToolDefinition, BundleName } from './types.js';
