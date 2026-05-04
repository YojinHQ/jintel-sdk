# Benchmark Results

Curated runs of [`benchmark/`](../README.md). Each entry is a single sweep across all four variants (`bare`, `anthropic-web-search`, `jintel-mcp`, `jintel-cli`) on the [corpus](../corpus/) at the time of the run.

Raw JSONL transcripts are not committed — they live under `benchmark/reports/runs/` (gitignored) on the machine that produced the sweep.

## Latest

### [2026-04-29 — Haiku 4.5 + Opus 4.7](./2026-04-29-haiku-opus.md)

Fifteen-question corpus, two models, four variants — 120 runs total.

| model            | variant              | pass rate | mean credits | p50 latency |
|------------------|----------------------|-----------|--------------|-------------|
| claude-haiku-4-5 | bare                 | 20.0%     | n/a          | 2.2s        |
| claude-haiku-4-5 | anthropic-web-search | 66.7%     | n/a          | 6.6s        |
| claude-haiku-4-5 | jintel-cli           | 26.7%     | 19.7         | 28.5s       |
| claude-haiku-4-5 | jintel-mcp           | **66.7%** | 7.0          | 5.8s        |
| claude-opus-4-7  | bare                 | 33.3%     | n/a          | 3.3s        |
| claude-opus-4-7  | anthropic-web-search | 60.0%     | n/a          | 11.1s       |
| claude-opus-4-7  | jintel-cli           | 60.0%     | 27.4         | 42.6s       |
| claude-opus-4-7  | jintel-mcp           | **86.7%** | 9.3          | 8.0s        |

**Headline:** `jintel-mcp` is the top-accuracy variant on both models — Haiku-with-jintel-mcp ties Haiku-with-web-search on accuracy (66.7%) and beats Opus-with-web-search (60.0%) at roughly half the latency, while Opus-with-jintel-mcp leads the field at 86.7%.

## Reproducing a result

```bash
# Single model, full sweep
pnpm bench --model claude-haiku-4-5 --variant all
pnpm bench:report

# Both models (run twice and use --all on the report)
pnpm bench --model claude-haiku-4-5 --variant all
pnpm bench --model claude-opus-4-7 --variant all
pnpm bench:report --all
```

Numbers will drift run-to-run for the live-data queries (q-003 through q-008, q-012, and q-015) since they reference dates that have since moved further into the past — re-grading against a different "today" will change which sources still surface the right answer.

## Adding a new result

1. Run a sweep: `pnpm bench --model <model> --variant all`
2. Generate the markdown: `pnpm bench:report`
3. Copy `benchmark/reports/<timestamp>.md` → `benchmark/results/<date>-<descriptor>.md`
4. Add a row above with headline numbers and a one-line takeaway.
