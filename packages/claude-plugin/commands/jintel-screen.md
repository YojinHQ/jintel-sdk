---
description: Run a sanctions screen on a name via Jintel.
argument-hint: <name> [--country XX]
---

Run a sanctions screen on the name in `$ARGUMENTS` using the `jintel_sanctions_screen` MCP tool.

1. Parse `$ARGUMENTS`: everything before `--country` is the name; an optional `--country XX` flag provides an ISO-2 country code.
2. Call `jintel_sanctions_screen` with the name (and country if present).
3. If `matched: true`: list each hit with name, programs, and score. Flag clearly as a potential match requiring human review.
4. If no match: state plainly that the name does not appear on the screened sanctions list. Do NOT invent adjacent risks.
5. Remind the user that the sanctions screen covers one watchlist — full KYC coverage requires additional watchlists not included in this check.
