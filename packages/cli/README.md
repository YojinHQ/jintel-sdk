# @yojinhq/jintel-cli

Command-line interface for the [Jintel](https://api.jintel.ai) intelligence API — a
thin wrapper around `@yojinhq/jintel-client`.

## Install

```bash
npm install -g @yojinhq/jintel-cli
# or: pnpm add -g @yojinhq/jintel-cli
```

## Credentials

The CLI resolves the API key in this order:

1. `--api-key <key>` flag
2. `JINTEL_API_KEY` environment variable
3. `~/.jintel/config.json` (`{"apiKey": "...", "baseUrl": "..."}`)

The base URL defaults to `https://api.jintel.ai/api`. Override with
`--base-url <url>` or `JINTEL_API_URL`.

## Usage

### Core

```bash
jintel quote AAPL MSFT                       # batch quotes (table)
jintel quote BTC --json                      # raw JSON

jintel search "Apple"                        # entity search
jintel search "Apple" --type COMPANY --limit 5

jintel enrich AAPL                           # all sub-graphs (JSON)
jintel enrich AAPL --fields news,technicals

jintel sanctions "John Doe" --country US     # Sanctions screening
jintel price-history AAPL --range 1mo        # OHLCV candles
jintel market-status                         # US market session
```

### Per-entity sub-graphs

Every entity sub-graph has a dedicated command. Output is JSON.

```bash
jintel news AAPL --since 2026-01-01 --limit 10
jintel research AAPL
jintel sentiment AAPL                        # aggregate score + 24h momentum
jintel social AAPL                           # raw Reddit / Twitter
jintel discussions AAPL --min-points 100
jintel predictions AAPL --only-open
jintel risk-signals AAPL --severities HIGH,CRITICAL
jintel regulatory AAPL --filing-types FILING_10K,FILING_10Q
jintel periodic-filings AAPL --limit 5
jintel technicals AAPL                       # RSI, MACD, BB, EMA, etc.
jintel derivatives AAPL --option-type CALL --strike-min 200
jintel ownership AAPL                        # institutional / insider / retail %
jintel top-holders AAPL --limit 10
jintel insider-trades AAPL --is-officer --acquired-disposed ACQUIRED
jintel financials AAPL --period-types 12M
jintel executives AAPL --sort-by PAY_DESC
jintel earnings-calendar AAPL --limit 8
jintel earnings-press-releases AAPL
jintel segmented-revenue AAPL --dimensions GEOGRAPHY
jintel analyst-consensus AAPL
jintel short-interest AAPL
jintel clinical-trials PFE --phase PHASE3 --status RECRUITING
jintel fda-events PFE --types DRUG_RECALL --severity 'CLASS I'
jintel litigation META --only-active
jintel government-contracts LMT --min-amount 1000000

# Compact dispatcher — one command, 27 sub-graph kinds
jintel query news AAPL --limit 5
jintel query risk AAPL
jintel query top_holders BRK.B
```

### Macro & cross-sectional

```bash
jintel gdp US --type REAL                    # GDP time series
jintel inflation US                          # CPI / inflation
jintel interest-rates US                     # Policy rates
jintel sp500-multiples SHILLER_PE_MONTH      # CAPE / yields
jintel macro-series UNRATE,CPIAUCSL          # FRED-style (batch via comma)
jintel campaign-finance "Apple" --cycle 2024
jintel institutional-holdings 0001067983
jintel fama-french THREE_FACTOR_DAILY
```

### Agent discovery

```bash
jintel list-tools                            # JSON dump of every command + description
jintel list-tools | jq -r '.[].name'         # just the names
jintel --help                                # human-readable index
jintel <command> --help                      # per-command usage
```

Every command accepts `--json` to emit raw JSON (pipe-friendly) and `--help` to
show per-command usage. Sub-graph commands always emit JSON (data is too nested
for tables). Table output uses plain aligned columns — no colors or escape codes.

## Exit codes

| Code | Meaning            |
|------|--------------------|
| 0    | Success            |
| 1    | Runtime error      |
| 2    | Usage error        |
| 3    | Auth error         |
