# Jintel SDK

Public SDK monorepo for the [Jintel](https://api.jintel.ai) intelligence API — a GraphQL endpoint that unifies market data, news, regulatory filings, sanctions screening, macro indicators, and more behind one key.

Get an API key at [api.jintel.ai](https://api.jintel.ai).

## Packages

| Package | Install | Use |
|---|---|---|
| [`@yojinhq/jintel-client`](packages/client) | `npm i @yojinhq/jintel-client` | TypeScript SDK — typed queries, Zod schemas, response cache |
| [`@yojinhq/jintel-cli`](packages/cli) | `npm i -g @yojinhq/jintel-cli` | `jintel` command for terminals, shell scripts, CI |
| [`@yojinhq/jintel-mcp`](packages/mcp) | `npx -y @yojinhq/jintel-mcp` | MCP server for Claude Desktop, Claude Code, and other MCP clients |
| [`jintel` plugin](packages/claude-plugin) | `claude plugin install jintel@YojinHQ` | One-shot Claude Code plugin: MCP server + skill + slash commands |

All four wrap the same GraphQL API.

Array sub-graphs accept a per-field `filter` argument — generic date/limit/sort via `ArrayFilterInput`, plus domain-specific inputs for SEC filings (`FilingsFilterInput`), risk signals (`RiskSignalFilterInput`), futures (`FuturesCurveFilterInput`), and options chains (`OptionsChainFilterInput`). See [`packages/client/README.md`](packages/client/README.md#filtering-array-sub-graphs) for examples.

## Auth modes

Every package supports two auth modes — set exactly one:

- **Bearer (API key)** — `JINTEL_API_KEY=jk_live_…`, get one at [api.jintel.ai](https://api.jintel.ai). Org-billed via plan + credit pool.
- **x402 wallet (keyless)** — `JINTEL_WALLET_PRIVATE_KEY=0x…`, pays per query in USDC on Base (~$0.015 floor). Optional `JINTEL_X402_MAX_VALUE` caps spend per query (atomic USDC, default `1000000` = $1). Agent-native: no signup, no Bearer — the payer wallet auto-identifies the caller. See [`packages/client/README.md`](packages/client/README.md#agent--pay-per-query-x402-v2).

`JINTEL_API_KEY` wins if both are present.

## Quick start

```bash
# Either mode works:
export JINTEL_API_KEY=jk_live_your_key_here              # Bearer
# export JINTEL_WALLET_PRIVATE_KEY=0xabc...              # x402 wallet (USDC on Base)

# CLI
npm i -g @yojinhq/jintel-cli
jintel quote AAPL MSFT

# MCP (Claude Desktop ~/Library/Application Support/Claude/claude_desktop_config.json)
#   "mcpServers": { "jintel": { "command": "npx", "args": ["-y", "@yojinhq/jintel-mcp"],
#                               "env": { "JINTEL_API_KEY": "..." } } }
# Wallet mode: swap "JINTEL_API_KEY" for "JINTEL_WALLET_PRIVATE_KEY" in the env block.

# Claude Code plugin
claude plugin marketplace add YojinHQ/jintel-sdk
claude plugin install jintel@YojinHQ
```

## Local development

```bash
pnpm install
pnpm build        # build all packages
pnpm typecheck
pnpm test
```

## Publishing

```bash
pnpm publish:client patch   # or minor / major
pnpm publish:cli patch
pnpm publish:mcp patch
```

## License

MIT — see [LICENSE](LICENSE).

## Links

- API docs: https://api.jintel.ai/docs
- Homepage: https://api.jintel.ai
- Main (private) repo: Jintel API server lives in a separate repo owned by Othentic Labs.
