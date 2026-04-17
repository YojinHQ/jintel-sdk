---
description: Review a portfolio of tickers — quotes, fundamentals, and headlines.
argument-hint: <ticker> [ticker ...]
---

Review the portfolio of tickers in `$ARGUMENTS` using `jintel_batch_enrich`.

1. Parse `$ARGUMENTS` as a list of tickers (space- or comma-separated, max 20). Normalize to uppercase.
2. Call `jintel_batch_enrich` ONCE with all tickers and `fields: ["market","fundamentals","news"]`.
3. Render a summary table with columns: Ticker, Price, Change %, P/E, Mkt Cap.
4. Below the table, list 1 top headline per ticker (title, source, date).
5. If any ticker failed to resolve, list them at the bottom under "Unavailable".
6. Do NOT give buy/sell recommendations.
