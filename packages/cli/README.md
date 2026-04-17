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

```bash
jintel quote AAPL MSFT                       # batch quotes (table)
jintel quote BTC --json                      # raw JSON

jintel search "Apple"                        # entity search
jintel search "Apple" --type COMPANY --limit 5

jintel enrich AAPL                           # all sub-graphs (JSON)
jintel enrich AAPL --fields news,technicals

jintel sanctions "John Doe" --country US     # Sanctions screening
jintel price-history AAPL --range 1mo        # OHLCV candles
jintel short-interest AAPL                   # Short interest reports
jintel campaign-finance "Apple" --cycle 2024 # PAC / campaign finance
jintel institutional-holdings 0001067983     # 13F holdings by CIK
jintel fama-french THREE_FACTOR_DAILY        # Fama-French factors

jintel market-status                         # US market session

jintel --help
jintel <command> --help
```

Every command accepts `--json` to emit raw JSON (pipe-friendly) and `--help` to
show per-command usage. Table output uses plain aligned columns — no colors or
escape codes.

## Exit codes

| Code | Meaning            |
|------|--------------------|
| 0    | Success            |
| 1    | Runtime error      |
| 2    | Usage error        |
| 3    | Auth error         |
