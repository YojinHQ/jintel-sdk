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

### Core

| Tool | Purpose |
|---|---|
| `jintel_quote` | Real-time quotes for stocks, crypto, indices |
| `jintel_search` | Search entities by name / ticker / keyword |
| `jintel_enrich` | Full profile for one ticker |
| `jintel_batch_enrich` | Full profiles for up to 20 tickers |
| `jintel_sanctions_screen` | Sanctions screening by name |
| `jintel_price_history` | OHLCV candles for up to 20 tickers |
| `jintel_market_status` | US market open/close status |
| `jintel_query` | Compact dispatcher — single tool that routes to any per-entity sub-graph by `kind` |

### Per-entity sub-graphs

| Tool | Purpose |
|---|---|
| `jintel_news` | Recent news articles with sentiment + source filters |
| `jintel_research` | Web research articles |
| `jintel_sentiment` | Aggregated social sentiment + 24h momentum |
| `jintel_social` | Raw Reddit / Twitter mentions and top comments |
| `jintel_discussions` | Hacker News stories filtered by points / comments |
| `jintel_predictions` | Polymarket / Kalshi prediction-market events |
| `jintel_risk_signals` | Sanctions, litigation, regulatory actions, adverse media, PEP |
| `jintel_regulatory` | SEC filings + sanctions matches + campaign finance |
| `jintel_periodic_filings` | 10-K / 10-Q / 8-K filings with summaries |
| `jintel_technicals` | RSI, MACD, BB, EMA, SMA, ATR, ADX, MFI, VWAP, etc |
| `jintel_derivatives` | Futures curve + options chain (filterable by strike, OI, volume) |
| `jintel_short_interest` | Bi-monthly short interest reports |
| `jintel_ownership` | Institutional / insider / retail breakdown |
| `jintel_top_holders` | Top institutional holders by shares |
| `jintel_institutional_holdings` | 13F holdings by filer CIK |
| `jintel_insider_trades` | Form 4 transactions (officers, directors, 10% owners) |
| `jintel_financials` | Income statement / balance sheet / cash flow |
| `jintel_executives` | Officers + compensation |
| `jintel_earnings_calendar` | Past + upcoming earnings reports with EPS surprise |
| `jintel_earnings_press_releases` | Earnings press releases with summaries |
| `jintel_segmented_revenue` | Revenue by product / segment / geography / customer |
| `jintel_analyst_consensus` | Wall Street recommendation + price target |
| `jintel_clinical_trials` | Clinical trial registrations (filter by phase / status) |
| `jintel_fda_events` | FDA adverse events + drug / device recalls |
| `jintel_litigation` | Active + historical lawsuits |
| `jintel_government_contracts` | US government contract awards |

### Macro & cross-sectional

| Tool | Purpose |
|---|---|
| `jintel_gdp` | GDP time series by country (REAL / NOMINAL / FORECAST) |
| `jintel_inflation` | CPI / inflation time series by country |
| `jintel_interest_rates` | Policy interest rates by country |
| `jintel_sp500_multiples` | S&P 500 PE / Shiller PE / dividend yield / earnings yield |
| `jintel_macro_series` | FRED-style time series by ID (single or batch) |
| `jintel_fama_french` | Fama-French 3- or 5-factor returns |
| `jintel_campaign_finance` | US PAC / candidate committee data |

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
