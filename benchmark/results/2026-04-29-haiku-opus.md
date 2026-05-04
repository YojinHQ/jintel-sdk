# Jintel Benchmark Report

Records: 120

## Accuracy

| model            | variant              | n  | pass  |
|------------------|----------------------|----|-------|
| claude-haiku-4-5 | anthropic-web-search | 15 | 66.7% |
| claude-haiku-4-5 | bare                 | 15 | 20.0% |
| claude-haiku-4-5 | jintel-cli           | 15 | 26.7% |
| claude-haiku-4-5 | jintel-mcp           | 15 | 66.7% |
| claude-opus-4-7  | anthropic-web-search | 15 | 60.0% |
| claude-opus-4-7  | bare                 | 15 | 33.3% |
| claude-opus-4-7  | jintel-cli           | 15 | 60.0% |
| claude-opus-4-7  | jintel-mcp           | 15 | 86.7% |

## Cost

| model            | variant              | mean tokens | mean peak ctx | mean credits |
|------------------|----------------------|-------------|---------------|--------------|
| claude-haiku-4-5 | anthropic-web-search | 2832        | 42734         | n/a          |
| claude-haiku-4-5 | bare                 | 423         | 252           | n/a          |
| claude-haiku-4-5 | jintel-cli           | 21226       | 5722          | 19.7         |
| claude-haiku-4-5 | jintel-mcp           | 16071       | 25827         | 7.0          |
| claude-opus-4-7  | anthropic-web-search | 1946        | 44751         | n/a          |
| claude-opus-4-7  | bare                 | 467         | 339           | n/a          |
| claude-opus-4-7  | jintel-cli           | 10488       | 5621          | 27.4         |
| claude-opus-4-7  | jintel-mcp           | 49705       | 46901         | 9.3          |

- **mean tokens** — input + output across all turns, averaged across runs
- **mean peak ctx** — peak tokens loaded into the model context per turn (input + cache_read + cache_creation; includes cached system prompts and server-side tool payloads such as web_search results)
- **mean credits** — Jintel credits drained per run (n/a for variants with no Jintel upstream)

## Tool use

| model            | variant              | mean tool calls | TIR    | TESR   | CER    |
|------------------|----------------------|-----------------|--------|--------|--------|
| claude-haiku-4-5 | anthropic-web-search | 2.53            | 100.0% | 100.0% | 100.0% |
| claude-haiku-4-5 | bare                 | 0.00            | 0.0%   | n/a    | n/a    |
| claude-haiku-4-5 | jintel-cli           | 8.20            | 100.0% | 100.0% | 100.0% |
| claude-haiku-4-5 | jintel-mcp           | 2.40            | 100.0% | 100.0% | 100.0% |
| claude-opus-4-7  | anthropic-web-search | 2.67            | 100.0% | 97.5%  | 93.3%  |
| claude-opus-4-7  | bare                 | 0.00            | 0.0%   | n/a    | n/a    |
| claude-opus-4-7  | jintel-cli           | 6.80            | 100.0% | 100.0% | 100.0% |
| claude-opus-4-7  | jintel-mcp           | 2.80            | 100.0% | 100.0% | 100.0% |

- **TIR** — Tool Invocation Rate: % of runs that invoked ≥1 tool
- **TESR** — Tool Execution Success Rate: % of tool calls without error
- **CER** — Conditional Execution Rate: % of tool-using runs whose calls all succeeded

## Latency

| model            | variant              | p50 ms | p95 ms | mean think ms | mean tool ms |
|------------------|----------------------|--------|--------|---------------|--------------|
| claude-haiku-4-5 | anthropic-web-search | 6615   | 11639  | 6969          | 0            |
| claude-haiku-4-5 | bare                 | 2171   | 4082   | 2431          | 0            |
| claude-haiku-4-5 | jintel-cli           | 28538  | 49383  | 15244         | 12186        |
| claude-haiku-4-5 | jintel-mcp           | 5784   | 18057  | 6068          | 1716         |
| claude-opus-4-7  | anthropic-web-search | 11142  | 25561  | 12795         | 0            |
| claude-opus-4-7  | bare                 | 3265   | 5090   | 3372          | 0            |
| claude-opus-4-7  | jintel-cli           | 42605  | 71916  | 24470         | 11965        |
| claude-opus-4-7  | jintel-mcp           | 8036   | 29293  | 10965         | 1110         |

- **p50 / p95 ms** — wall-clock latency from agent start to final answer
- **mean think ms / mean tool ms** — split: model thinking vs sum of tool round-trips per run
