# Jintel Benchmark

Measurement framework for comparing LLM-with-tools configurations on financial-research queries.

## Quick start

```bash
# Sanity check — single question, single variant
pnpm bench --model claude-haiku-4-5 --variant bare --queries q-001

# Full sweep
pnpm bench --model claude-haiku-4-5 --variant all
pnpm bench:report
```

The runner writes per-run JSONL to `benchmark/reports/runs/sweep-<UTC-timestamp>.jsonl`.
`bench:report` aggregates the latest sweep into a markdown table at `benchmark/reports/<ISO-timestamp>.md`.
Pass `--all` (i.e. `pnpm bench:report --all`) to aggregate every sweep on disk instead.

## CLI flags

| Flag        | Required | Values                                                                    | Default |
|-------------|----------|---------------------------------------------------------------------------|---------|
| `--model`   | yes      | any Anthropic model id (e.g. `claude-haiku-4-5`, `claude-opus-4-7`)       | —       |
| `--variant` | no       | `bare` \| `anthropic-web-search` \| `jintel-mcp` \| `jintel-cli` \| `all` | `all`   |
| `--queries` | no       | `all`, an integer (first N), or comma-separated ids (`q-001,q-003`)       | `all`   |

## Variants

| Variant                | What runs                                                                                                                                              |
|------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `bare`                 | model with no tools                                                                                                                                    |
| `anthropic-web-search` | Anthropic's server-side `web_search_20250305` tool                                                                                                     |
| `jintel-mcp`           | published `@yojinhq/jintel-mcp` over stdio (auto-fetched via `npx`)                                                                                    |
| `jintel-cli`           | published `@yojinhq/jintel-cli` invoked through a `bash` tool (auto-fetched via `npx`); set `JINTEL_CLI_BIN_PATH` to use a local `dist/bin.js` for dev |

## Where questions live

`benchmark/corpus/*.yaml` — one file per question, named `q-<NNN>.yaml`. Each file is loaded, validated, and sorted by id at startup (`corpus-loader.ts`).

Schema (see `types.ts → CorpusEntry`):

```yaml
id: q-001                               # unique id, must match filename
nl_question: "What was 3M's year-end FY2018 net PP&E in USD billions?"
tags: [single-source, financials]       # free-form labels for slicing reports
expected:
  field: net_ppne_fy2018                # informational, not used by grader
  value: 8.70                           # ground truth — type drives auto-detection
  unit: USD_billions                    # informational
  source: https://www.sec.gov/...       # provenance for human review
comparison:                             # optional; auto-detected from `expected.value` type
  type: numeric_tolerance               # exact_match | numeric_tolerance | set_overlap | structured_match
  tolerance_pct: 1.0                    # only for numeric_tolerance
  threshold: 0.5                        # only for set_overlap (Jaccard ≥ threshold)
  fields: { ... }                       # only for structured_match
```

Auto-detection (when `comparison:` is omitted):

| `expected.value` type | Inferred rule                      |
|-----------------------|------------------------------------|
| `number`              | `numeric_tolerance` (tolerance 1%) |
| `string`              | `exact_match`                      |
| `array`               | `set_overlap` (Jaccard ≥ 0.5)      |

Override by adding an explicit `comparison:` block. See `q-005.yaml` for a date string with `exact_match`.

### Adding a question

1. Drop a new `q-NNN.yaml` into `benchmark/corpus/`.
2. Fill in `id`, `nl_question`, `expected.value`, `expected.source`.
3. Either rely on auto-detection or add an explicit `comparison:` block.
4. Re-run `pnpm bench` — the loader picks it up automatically.

## How grading works

Per run, the pipeline is:

1. **Run** (`runners/anthropic.ts`) — fans the question through the chosen adapter, captures the full transcript, token usage, tool calls, and timing.
2. **Extract** (`grader/extract.ts`) — pulls the answer from the last assistant message:
   - first tries `<answer>...</answer>` tags (the system prompt instructs the model to wrap final values),
   - falls back to the full last-assistant-message text,
   - returns `null` if neither produces text.
3. **Compare** (`grader/compare.ts`) — applies the corpus `comparison.type`:
   - `exact_match` → `String(actual) === String(expected)`
   - `numeric_tolerance` → strips `$ , % whitespace` from both sides, parses as numbers, fails if `|Δ| / |expected| × 100 > tolerance_pct` (or `|actual| > tolerance_pct/100` when expected is 0)
   - `set_overlap` → Jaccard similarity of the two arrays must be ≥ `threshold`
   - `structured_match` → recurses per-field using the rule named in `fields`
4. **Record** — pass/fail, the diff, and all telemetry land in the sweep JSONL.

The system prompt that asks for `<answer>` tags is at `benchmark/prompts/system.md`.

## Report metrics

`pnpm bench:report` produces four sections (`reporter/markdown.ts`):

- **Accuracy** — pass rate per `(model, variant)` cell.
- **Cost** — mean total tokens, mean peak ctx (input + cache_read + cache_creation per turn — includes cached system prompts and server-side tool payloads such as web_search results), mean Jintel credits drained per run.
- **Tool use** — mean tool calls per run, plus FinToolBench-style metrics:
  - **TIR** (Tool Invocation Rate) — % of runs that invoked ≥1 tool
  - **TESR** (Tool Execution Success Rate) — % of tool calls without error
  - **CER** (Conditional Execution Rate) — % of tool-using runs whose calls all succeeded
- **Latency** — p50, p95, mean think time, mean tool round-trip time.

Server-side `web_search` calls are counted in the tool-use metrics with `latency_ms = 0` (Anthropic executes them inside `messages.create`, so the runner can't measure their wall time directly).

## Required env

Set in `.env` or your shell:

| Variable                    | When                       | Notes                                                               |
|-----------------------------|----------------------------|---------------------------------------------------------------------|
| `ANTHROPIC_API_KEY`         | always                     | unless using OAuth via the Claude CLI auth flow                     |
| `JINTEL_API_KEY`            | `jintel-mcp`, `jintel-cli` | for credit metering and tool auth                                   |
| `JINTEL_BASE_URL`           | optional                   | defaults to `https://api.jintel.ai/api`; override for local/staging |
| `JINTEL_WALLET_PRIVATE_KEY` | optional                   | only if x402 top-ups are in play                                    |
| `JINTEL_X402_MAX_VALUE`     | optional                   | per-call USD cap for x402                                           |

## Optional tunables

```bash
# Per-variant inter-query delay (ms). Defaults: bare=1000, jintel-mcp=3000, jintel-cli=3000, anthropic-web-search=8000.
BENCH_INTER_QUERY_DELAY_MS_ANTHROPIC_WEB_SEARCH=12000

# Or one global delay for all variants (per-variant overrides take precedence)
BENCH_INTER_QUERY_DELAY_MS=5000

# Override jintel-cli to a local dev build instead of npx-fetching the published package
JINTEL_CLI_BIN_PATH=/path/to/jintel-sdk/packages/cli/dist/bin.js

# Override jintel-mcp's spawn target (e.g. for a local dev MCP)
JINTEL_MCP_COMMAND=node
JINTEL_MCP_ARGS="/path/to/local/mcp/dist/bin.js --flag"
```

## Layout

```text
benchmark/
├── adapters/        # Tool surfaces: bare, anthropic-web-search, jintel-mcp, jintel-cli
├── auth/            # Anthropic API-key + OAuth credential resolution
├── cli/             # bench (run sweeps) + report (aggregate JSONL → markdown)
├── corpus/          # Question YAMLs (q-NNN.yaml)
├── grader/          # extract (transcript → answer) + compare (rule dispatch)
├── prompts/         # System prompt template (asks for <answer> tags)
├── reporter/        # JSONL → markdown aggregator
├── reports/         # Generated markdown reports + runs/ JSONL sweeps
├── runners/         # anthropic — drives the agent loop
├── corpus-loader.ts # YAML load + validate + auto-detect comparison rule
├── credits.ts       # Diff /api/v1/me + /api/v1/credits/balance snapshots per run
└── types.ts         # RunRecord, CorpusEntry, etc.
```

See `docs/superpowers/specs/2026-04-27-jintel-benchmark-framework-design.md` for the original design.
