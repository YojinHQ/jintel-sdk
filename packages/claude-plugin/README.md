# Jintel — Claude Code Plugin

Financial intelligence inside Claude — one install gives you market data, news, regulatory filings, sanctions screening, macro indicators, and more.

Bundles:
- **MCP server** (`@yojinhq/jintel-mcp`) — 11 tools (`jintel_quote`, `jintel_search`, `jintel_enrich`, `jintel_batch_enrich`, `jintel_sanctions_screen`, `jintel_price_history`, …)
- **Skill** — domain knowledge so Claude knows *when* and *how* to use each tool
- **Slash commands** — `/jintel-quote`, `/jintel-research`, `/jintel-screen`, `/jintel-portfolio`

## Install

### Claude Code

```bash
claude plugin marketplace add YojinHQ/jintel-sdk
claude plugin install jintel@YojinHQ
```

Set your API key once:

```bash
export JINTEL_API_KEY=jk_live_your_key_here
```

Get a key at [api.jintel.ai](https://api.jintel.ai).

### Claude Desktop

Claude Desktop doesn't install plugins yet — install just the MCP server:

```json
{
  "mcpServers": {
    "jintel": {
      "command": "npx",
      "args": ["-y", "@yojinhq/jintel-mcp"],
      "env": { "JINTEL_API_KEY": "jk_live_..." }
    }
  }
}
```

## Usage

Once installed, ask Claude naturally:

```
What's Apple trading at?
Research NVDA
Screen "Gazprom" for sanctions
Review my portfolio: AAPL, MSFT, GOOGL, NVDA
What does Berkshire Hathaway hold?
```

Or use the slash commands:

```
/jintel-quote AAPL MSFT
/jintel-research Apple
/jintel-screen Vladimir Putin --country RU
/jintel-portfolio AAPL MSFT GOOGL NVDA TSLA
```

## Files

```
packages/claude-plugin/
├── .claude-plugin/plugin.json   # Plugin manifest
├── .mcp.json                    # MCP server config (runs jintel-mcp via npx)
├── skills/jintel/SKILL.md       # Workflows + rules for Claude
├── commands/                    # Slash commands
│   ├── jintel-quote.md
│   ├── jintel-research.md
│   ├── jintel-screen.md
│   └── jintel-portfolio.md
└── README.md
```

## License

MIT
