# @yojinhq/jintel-mcp

Model Context Protocol (MCP) server for the [Jintel](https://api.jintel.ai) intelligence API. Exposes Jintel's market data, news, regulatory, and risk screening capabilities as MCP tools so Claude Desktop, Claude Code, and other MCP clients can query Jintel directly.

## Install

```bash
npm install -g @yojinhq/jintel-mcp
```

Or run without installing:

```bash
npx -y @yojinhq/jintel-mcp
```

## Configuration

Set your Jintel API key via env var. Get a key at [api.jintel.ai](https://api.jintel.ai).

| Variable          | Required | Description                                      |
|-------------------|----------|--------------------------------------------------|
| `JINTEL_API_KEY`  | Yes      | Your Jintel API key                              |
| `JINTEL_BASE_URL` | No       | Override base URL (default: `https://api.jintel.ai/api`) |

## Claude Desktop

Add to `claude_desktop_config.json`:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "jintel": {
      "command": "npx",
      "args": ["-y", "@yojinhq/jintel-mcp"],
      "env": {
        "JINTEL_API_KEY": "jk_live_your_key_here"
      }
    }
  }
}
```

Restart Claude Desktop. You should see the Jintel tools available in the tools menu.

## Claude Code

```bash
claude mcp add jintel -- npx -y @yojinhq/jintel-mcp
# Then set the API key in the resulting config, or export JINTEL_API_KEY in your shell.
```

## Tools

| Tool | Purpose |
|---|---|
| `jintel_quote` | Real-time quotes for stocks, crypto, indices |
| `jintel_search` | Search entities by name / ticker / keyword |
| `jintel_enrich` | Full profile for one ticker (news, fundamentals, technicals, …) |
| `jintel_batch_enrich` | Full profiles for up to 20 tickers |
| `jintel_sanctions_screen` | Sanctions screening by name |
| `jintel_price_history` | OHLCV candles for up to 20 tickers |
| `jintel_short_interest` | Short interest reports |
| `jintel_campaign_finance` | US PAC / campaign finance lookup |
| `jintel_institutional_holdings` | 13F institutional holdings by filer CIK |
| `jintel_fama_french` | Fama-French factor returns |
| `jintel_market_status` | US market open/close status |

## Local dev

```bash
pnpm install
pnpm --filter @yojinhq/jintel-mcp build
JINTEL_API_KEY=... node packages/mcp/dist/bin.js
```

Talk to it directly:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | JINTEL_API_KEY=dummy node packages/mcp/dist/bin.js
```

## License

MIT
