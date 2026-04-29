import type { ComparisonRule } from '../types.js';

export interface CompareSpec {
  type: ComparisonRule;
  value: unknown;
  tolerance_pct?: number;
  threshold?: number;
  fields?: Record<string, { type: ComparisonRule; tolerance_pct?: number }>;
}

export interface CompareResult {
  pass: boolean;
  rule: ComparisonRule;
  diff: unknown;
}

export function compare(actual: unknown, spec: CompareSpec): CompareResult {
  switch (spec.type) {
    case 'exact_match':
      return exactMatch(actual, spec.value);
    case 'numeric_tolerance':
      return numericTolerance(actual, spec.value, spec.tolerance_pct ?? 1);
    case 'set_overlap':
      return setOverlap(actual, spec.value, spec.threshold ?? 0.5);
    case 'structured_match':
      return structuredMatch(actual, spec.value, spec.fields ?? {});
  }
}

function exactMatch(actual: unknown, expected: unknown): CompareResult {
  const pass = String(actual) === String(expected);
  return {
    pass,
    rule: 'exact_match',
    diff: pass ? null : { expected, actual },
  };
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
  if (e === 0) {
    // Percentage tolerance is undefined when expected is 0; fall back to an absolute
    // threshold of (tolerance_pct / 100) in the expected unit. Pick a different rule
    // (e.g. exact_match) if the absolute scale is unsuitable.
    const pass = Math.abs(a) <= tolerancePct / 100;
    return { pass, rule: 'numeric_tolerance', diff: pass ? null : { expected: e, actual: a } };
  }
  const deltaPct = Math.abs((a - e) / e) * 100;
  const pass = deltaPct <= tolerancePct;
  return {
    pass,
    rule: 'numeric_tolerance',
    diff: pass ? null : { expected: e, actual: a, deltaPct, tolerance_pct: tolerancePct },
  };
}

function setOverlap(actual: unknown, expected: unknown, threshold: number): CompareResult {
  if (!Array.isArray(actual) || !Array.isArray(expected)) {
    return { pass: false, rule: 'set_overlap', diff: { error: 'both must be arrays' } };
  }
  const a = new Set(actual.map(String));
  const e = new Set(expected.map(String));
  const intersection = new Set([...a].filter((x) => e.has(x)));
  const union = new Set([...a, ...e]);
  const jaccard = union.size === 0 ? 1 : intersection.size / union.size;
  const pass = jaccard >= threshold;
  return {
    pass,
    rule: 'set_overlap',
    diff: pass ? null : { jaccard, threshold, missing: [...e].filter((x) => !a.has(x)) },
  };
}

function structuredMatch(
  actual: unknown,
  expected: unknown,
  fields: Record<string, { type: ComparisonRule; tolerance_pct?: number }>,
): CompareResult {
  if (typeof actual !== 'object' || actual === null || typeof expected !== 'object' || expected === null) {
    return { pass: false, rule: 'structured_match', diff: { error: 'both must be objects' } };
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
