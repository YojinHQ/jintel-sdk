export type VariantId = 'bare' | 'anthropic-web-search' | 'jintel-mcp' | 'jintel-cli';
export type ExtractionPath = 'answer-tag' | 'last-assistant-message' | 'failed';
export type ComparisonRule = 'exact_match' | 'numeric_tolerance' | 'set_overlap' | 'structured_match';

export interface TranscriptTurn {
  role: 'user' | 'assistant' | 'tool';
  content: unknown;
  tool_calls?: Array<{ id: string; name: string; input: unknown }>;
  tool_results?: Array<{ tool_use_id: string; content: unknown; is_error?: boolean }>;
}

export interface RunRecord {
  run_id: string;
  timestamp: string;
  corpus_version: string;
  jintel_sha: string;

  model_id: string;
  variant_id: VariantId;

  query_id: string;
  nl_question: string;

  system_prompt_hash: string;
  params: { temperature?: number; max_tokens: number; [k: string]: unknown };

  transcript: TranscriptTurn[];
  tokens: {
    input: number;
    output: number;
    peak_context: number;
    per_turn: Array<{ input: number; output: number }>;
  };
  tool_calls: Array<{ name: string; args: unknown; latency_ms: number; error?: string }>;
  timing: { total_ms: number; model_thinking_ms: number; tool_round_trip_ms: number };

  // True when the loop exited at MAX_AGENT_TURNS with the model still requesting tools.
  truncated?: boolean;

  // `charged` = total credits drained for this run (planΔ + topupΔ).
  credits?: { charged: number; fromPlan: number; fromTopup: number };

  extracted_answer: unknown;
  extraction_path: ExtractionPath;

  grade: { pass: boolean; comparison_rule: ComparisonRule; diff: unknown };
  errors: Array<{ phase: string; message: string }>;
}

export type UngradedRunRecord = Omit<RunRecord, 'extracted_answer' | 'extraction_path' | 'grade'>;

export interface CorpusEntry {
  id: string;
  nl_question: string;
  tags: string[];
  expected: {
    field?: string;
    value: unknown;
    unit?: string;
    source: string;
  };
  comparison: {
    type: ComparisonRule;
    tolerance_pct?: number;
    threshold?: number;
    precision_threshold?: number;
    recall_threshold?: number;
    fields?: Record<string, { type: ComparisonRule; tolerance_pct?: number }>;
  };
}
