---
description: Fetch live quotes for one or more tickers via Jintel.
argument-hint: <ticker> [ticker ...]
---

Fetch live quotes for the ticker(s) in `$ARGUMENTS` using the `jintel_quote` MCP tool.

1. Parse `$ARGUMENTS` as a space- or comma-separated list of ticker symbols. Normalize to uppercase.
2. If the list is empty, ask the user for a ticker.
3. Call `jintel_quote` **once** with the full array — never loop.
4. Render a compact table with columns: Ticker, Price, Change %, Volume, Market Cap.
5. If any ticker returned null, show it as "unavailable" — do not substitute 0.
