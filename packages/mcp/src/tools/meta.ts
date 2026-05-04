import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BundleName, ToolDefinition } from './types.js';
import { DOMAIN_BUNDLE_NAMES } from './types.js';

const CATALOG_DESCRIPTION = `Activates a bundle of additional tools. After loading, the new tools appear in tools/list and can be called like any other tool.

Available bundles (call with name=<bundle>):

  markets       Price history, technicals, options/futures, market status,
                Fama-French factors, short interest, S&P 500 multiples.
  ownership     13F institutional holdings, top holders, beneficial
                ownership, insider Form 4 trades.
  corporate     Executives, earnings calendar, earnings press releases,
                segmented revenue, analyst consensus / price targets.
  regulatory    Sanctions screening, SEC filings (10-K/Q), periodic
                filings, risk signals, litigation, FDA events, clinical
                trials, government contracts, campaign finance.
  macro         GDP, inflation, interest rates, FRED / macro series.
  qualitative   Research notes, sentiment, social posts, discussions
                (Reddit/Stocktwits), prediction markets (Polymarket).
  enrich        Multi-domain entity enrichment (single + batch).

If you need a domain not listed here, raw GraphQL via jintel_query covers
the full Jintel API.

Bundles are sticky for the session — once loaded, they remain available
until the connection ends.`;

export interface LoadBundleContext {
  server: McpServer;
  activeBundles: Set<BundleName>;
  emitListChanged: boolean;
  staticMode: boolean;
}

export function buildLoadBundleTool(ctx: LoadBundleContext): ToolDefinition {
  return {
    name: 'jintel_load_bundle',
    bundle: 'core',
    description: CATALOG_DESCRIPTION,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          enum: [...DOMAIN_BUNDLE_NAMES],
        },
      },
      required: ['name'],
      additionalProperties: false,
    },
    handler: async (args) => {
      const name = args.name;
      if (typeof name !== 'string' || !DOMAIN_BUNDLE_NAMES.includes(name as Exclude<BundleName, 'core'>)) {
        return {
          content: [
            {
              type: 'text',
              text: `unknown bundle "${String(name)}". valid: ${DOMAIN_BUNDLE_NAMES.join(', ')}`,
            },
          ],
          isError: true,
        };
      }
      const bundle = name as Exclude<BundleName, 'core'>;
      if (ctx.staticMode) {
        return {
          content: [
            {
              type: 'text',
              text: 'Bundles are fixed at startup in this deployment. To change, restart with JINTEL_TOOLSET=<comma-separated bundle names, e.g. core,markets,regulatory>.',
            },
          ],
        };
      }
      if (ctx.activeBundles.has(bundle)) {
        return {
          content: [
            {
              type: 'text',
              text: `Bundle "${bundle}" is already loaded. Call its tools directly.`,
            },
          ],
        };
      }
      ctx.activeBundles.add(bundle);
      if (ctx.emitListChanged) {
        ctx.server.sendToolListChanged();
      }
      return {
        content: [
          {
            type: 'text',
            text: `Loaded bundle "${bundle}". New tools are now available in tools/list.`,
          },
        ],
      };
    },
  };
}
