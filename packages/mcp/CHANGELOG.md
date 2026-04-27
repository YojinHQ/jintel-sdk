# Changelog

## 0.3.0 — Tool surface v2

- Default Claude Desktop / Cursor / Cline surface is now 6 core tools.
  Additional domain bundles load on demand via jintel_load_bundle.
- Set JINTEL_TOOLSET=all to restore the flat 41-tool surface exactly.
- Indexers and non-MCP-aware bridges (LangChain, OpenAI wrappers) auto-
  detect via clientInfo.name and receive the full surface unchanged.
- New optional `fields` argument on jintel_financials, jintel_segmented_
  revenue, jintel_institutional_holdings, jintel_insider_trades for
  selective field projection.
- Per-property description stripping in tool input schemas (~30%
  schema-token reduction).
- Estimated per-round token cost: ~24k → ~2.7k for the median Claude
  Desktop session, ~24k → ~16k for static-all consumers.
- Dynamic mode introduces jintel_load_bundle and list_changed
  notifications; JINTEL_DYNAMIC_CLIENTS controls which client names
  receive the dynamic surface (defaults include Claude, Cursor, Cline).

## 0.2.1 — x402 wallet support

- Added keyless x402 payment flow using USDC on Base via x402-fetch.
- Set JINTEL_WALLET_KEY to enable automatic micropayment settlement
  without a separate Jintel API key.
