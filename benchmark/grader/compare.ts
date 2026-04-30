import type { ComparisonRule } from '../types.js';

export interface CompareSpec {
  type: ComparisonRule;
  value: unknown;
  tolerance_pct?: number;
  threshold?: number;
  precision_threshold?: number;
  recall_threshold?: number;
  fields?: Record<string, { type: ComparisonRule; tolerance_pct?: number }>;
}

export interface CompareResult {
  pass: boolean;
  rule: ComparisonRule;
  diff: unknown;
}

// Extracted answers arrive as strings (from <answer> tags). For set_overlap and
// structured_match, parse JSON so models can emit `<answer>["A","B"]</answer>` or
// `<answer>{"revenue":383.285}</answer>`. Non-JSON falls through unchanged so the
// downstream rule produces its normal "must be array/object" diff.
function tryParseJson(v: unknown): unknown {
  if (typeof v !== 'string') return v;
  const trimmed = v.trim();
  if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) return v;
  try {
    return JSON.parse(trimmed);
  } catch {
    return v;
  }
}

export function compare(actual: unknown, spec: CompareSpec): CompareResult {
  switch (spec.type) {
    case 'exact_match':
      return exactMatch(actual, spec.value);
    case 'numeric_tolerance':
      return numericTolerance(actual, spec.value, spec.tolerance_pct ?? 1);
    case 'set_overlap':
      return setOverlap(tryParseJson(actual), spec.value, spec);
    case 'structured_match':
      return structuredMatch(tryParseJson(actual), spec.value, spec.fields ?? {});
  }
}

function exactMatch(actual: unknown, expected: unknown): CompareResult {
  const pass = String(actual) === String(expected);
  return { pass, rule: 'exact_match', diff: pass ? null : { expected, actual } };
}

function parseNumber(v: unknown): number | null {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return null;
  const cleaned = v.replace(/[$,\s%]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function numericTolerance(actual: unknown, expected: unknown, tolerancePct: number): CompareResult {
  const a = parseNumber(actual);
  const e = parseNumber(expected);
  if (a === null || e === null) {
    return { pass: false, rule: 'numeric_tolerance', diff: { expected, actual, error: 'unparseable' } };
  }
  // Percentage tolerance is undefined when expected is 0; fall back to an
  // absolute threshold of (tolerance_pct / 100) in the expected unit.
  const deltaPct = e === 0 ? Math.abs(a) * 100 : Math.abs((a - e) / e) * 100;
  const pass = deltaPct <= tolerancePct;
  return {
    pass,
    rule: 'numeric_tolerance',
    diff: pass ? null : { expected: e, actual: a, deltaPct, tolerance_pct: tolerancePct },
  };
}

function setOverlap(actual: unknown, expected: unknown, spec: CompareSpec): CompareResult {
  if (!Array.isArray(actual) || !Array.isArray(expected)) {
    return {
      pass: false,
      rule: 'set_overlap',
      diff: { error: 'both must be arrays', expected, actual },
    };
  }
  const a = new Set(actual.map(String));
  const e = new Set(expected.map(String));
  const hits = [...a].filter((x) => e.has(x)).length;
  const union = a.size + e.size - hits;
  const jaccard = union === 0 ? 1 : hits / union;
  const precision = a.size === 0 ? 1 : hits / a.size;
  const recall = e.size === 0 ? 1 : hits / e.size;

  const usePR = spec.precision_threshold !== undefined || spec.recall_threshold !== undefined;
  const pass = usePR
    ? precision >= (spec.precision_threshold ?? 0) && recall >= (spec.recall_threshold ?? 0)
    : jaccard >= (spec.threshold ?? 0.5);

  return {
    pass,
    rule: 'set_overlap',
    diff: pass
      ? null
      : {
          jaccard,
          precision,
          recall,
          missing: [...e].filter((x) => !a.has(x)),
          extras: [...a].filter((x) => !e.has(x)),
          expected: [...e],
          actual: [...a],
        },
  };
}

function structuredMatch(
  actual: unknown,
  expected: unknown,
  fields: Record<string, { type: ComparisonRule; tolerance_pct?: number }>,
): CompareResult {
  if (typeof actual !== 'object' || actual === null || typeof expected !== 'object' || expected === null) {
    return {
      pass: false,
      rule: 'structured_match',
      diff: { error: 'both must be objects', expected, actual },
    };
  }
  const a = actual as Record<string, unknown>;
  const e = expected as Record<string, unknown>;
  const fieldDiffs: Record<string, unknown> = {};
  let allPass = true;
  for (const [field, rule] of Object.entries(fields)) {
    const result = compare(a[field], { type: rule.type, value: e[field], tolerance_pct: rule.tolerance_pct });
    if (!result.pass) {
      allPass = false;
      fieldDiffs[field] = result.diff;
    }
  }
  return { pass: allPass, rule: 'structured_match', diff: allPass ? null : fieldDiffs };
}
