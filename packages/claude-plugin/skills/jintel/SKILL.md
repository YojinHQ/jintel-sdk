---
name: jintel
description: Use for financial intelligence tasks — stock/crypto quotes, fundamentals, news, technical indicators, regulatory filings, sanctions screening, institutional holdings, short interest, campaign finance, macro indicators. Routes through the Jintel MCP server (@yojinhq/jintel-mcp).
---

# Jintel — Financial Intelligence

Jintel aggregates financial data across markets, regulatory filings, sanctions lists, macro indicators, and more behind a unified API. Use it whenever the user asks about markets, companies, people, sanctions, filings, or macro data.

## When to use

Trigger on:
- **Quotes / prices**: "What's AAPL trading at?", "Show me BTC price"
- **Company research**: "Tell me about Apple", "Research NVDA"
- **Compliance / KYC**: "Screen this name for sanctions"
- **Filings**: "Latest 13F for Berkshire", "Regulatory filings for TSLA"
- **Short interest**: "Short interest in GME"
- **Politicians / PACs**: "Campaign finance for X PAC"
- **Macro**: "US GDP", "Inflation rate"
- **Technicals**: "RSI on AAPL", "MACD for SPY"
- **News**: "Latest news on Microsoft"

Do **not** use for: trading advice, price predictions, non-financial research.

## Tools

All 11 tools are prefixed `jintel_`:

| Tool | Use for |
|---|---|
| `jintel_quote` | Current price, change, volume, market cap for 1+ tickers |
| `jintel_search` | Resolve a company/person name to a ticker or entity |
| `jintel_enrich` | Full profile for ONE ticker (fundamentals, news, technicals, filings, etc.) |
| `jintel_batch_enrich` | Same as enrich but for up to 20 tickers in one call |
| `jintel_sanctions_screen` | Sanctions check by name |
| `jintel_price_history` | OHLCV candles for historical analysis |
| `jintel_short_interest` | Short interest reports |
| `jintel_campaign_finance` | PAC / campaign finance lookup |
| `jintel_institutional_holdings` | 13F institutional holdings by filer CIK |
| `jintel_fama_french` | Fama-French 3/5-factor returns (quant research) |
| `jintel_market_status` | Is the US market open right now? |

## Workflows

### Workflow 1 — Ticker quick look
User asks "What's AAPL doing?":
1. Call `jintel_quote` with `["AAPL"]`.
2. Report price, change %, volume. Done.

### Workflow 2 — Deep research
User asks "Research NVDA" or "Tell me about Apple":
1. If they gave a name (not a ticker), call `jintel_search` first to resolve.
2. Call `jintel_enrich` with fields like `["market","fundamentals","news","technicals","ownership","analyst"]`.
3. Summarize: business, current quote, key fundamentals, recent news, analyst consensus.

### Workflow 3 — Compliance screening
User asks "Check X for sanctions" or KYC-style questions:
1. Call `jintel_sanctions_screen` with the name (and country if given).
2. If `matched: true`, report the hits with programs and scores.
3. If no match, state that clearly — do NOT invent risks.

### Workflow 4 — Portfolio review
User pastes a list of tickers:
1. Call `jintel_batch_enrich` once with all tickers, fields `["market","fundamentals","news"]`.
2. Produce a table (price, change, P/E, mkt cap) + headline news per ticker.

### Workflow 5 — Historical / backtest
User wants a chart, backtest data, or historical prices:
1. Call `jintel_price_history` with the tickers, optional `range` (e.g. `"1mo"`, `"6mo"`, `"1y"`, `"5y"`, `"max"`).
2. For technical analysis, pair with `jintel_enrich` fields `["technicals"]`.

### Workflow 6 — Institutional ownership
"Who owns X?" → `jintel_enrich` with `["ownership","topHolders"]`.
"What does Berkshire own?" → `jintel_institutional_holdings` with `cik: "0001067983"`.

## Rules

- **Resolve names first.** If the user gives a company name without a ticker, call `jintel_search` before any other tool.
- **Prefer batch tools.** Never call `jintel_quote` or `jintel_enrich` in a loop — use the batch variants.
- **Request only the fields you need.** `jintel_enrich` accepts a `fields` array; omitting it fetches everything (slower and more expensive).
- **Filter array sub-graphs aggressively.** News, research, SEC filings, risk signals, options chains, and history series all accept a `filter` argument (date range / limit / sort, plus per-domain dimensions like SEC form types, signal severities, strike ranges, option type). Passing `limit: 5–10` and a `since:` date for news or `types: [FILING_10K, FILING_10Q]` for filings keeps payloads small. Options chains on liquid underliers can exceed 5 000 rows — always pass an options filter in production.
- **Report data age for non-live fields.** Financials, 13F, short interest are periodic — surface the report date.
- **Null is not zero.** When a tool returns `null` for a price or metric, say "unavailable" — don't render `0`.
- **Don't fabricate.** If the tools return empty, say so. Never invent tickers, filings, or matches.
- **No investment advice.** Report facts; don't recommend buys or sells.

## Setup (for the user)

If the tools aren't available, the MCP server isn't installed. Tell the user:

1. Get an API key at https://api.jintel.ai
2. Add to `claude_desktop_config.json`:
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
3. Restart Claude Desktop.

For Claude Code: `claude mcp add jintel -- npx -y @yojinhq/jintel-mcp`.
