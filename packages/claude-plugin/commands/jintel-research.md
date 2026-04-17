---
description: Deep research on a ticker or company — quote, fundamentals, news, analysts.
argument-hint: <ticker-or-name>
---

Produce a concise research brief on the entity in `$ARGUMENTS` using Jintel MCP tools.

1. If `$ARGUMENTS` looks like a ticker (1–5 uppercase letters, optional suffix like `-USD`), use it directly. Otherwise call `jintel_search` first and pick the best match — confirm the ticker with the user if ambiguous.
2. Call `jintel_enrich` once with `fields: ["market","fundamentals","news","analyst","ownership"]`.
3. Write a brief with these sections (omit any section where the data is empty — don't pad):
   - **Overview** — company name, sector, 1–2 sentence business description
   - **Quote** — price, change %, market cap
   - **Fundamentals** — P/E, forward P/E, EPS, dividend yield, beta, 52-week range
   - **Analyst consensus** — rating, price target, number of analysts
   - **Ownership** — insider %, institutional %, short interest %
   - **Recent news** — 3–5 most recent headlines with source and date
4. Do NOT give investment advice. Report facts only.
5. Null values → "unavailable". Never render as 0.
