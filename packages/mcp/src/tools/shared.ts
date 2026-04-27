import {
  ALL_ENRICHMENT_FIELDS,
  JintelAuthError,
  JintelPaymentRequiredError,
  JintelUnreachableError,
  JintelValidationError,
  type AcquisitionDirection,
  type ArraySubGraphOptions,
  type EnrichmentField,
  type Entity,
  type EnrichOptions,
  type EntityType,
  type FamaFrenchSeries,
  type JintelResult,
} from '@yojinhq/jintel-client';
import { JintelClient } from '@yojinhq/jintel-client';
import type { ToolCallResult } from './types.js';

export function ok(data: unknown): ToolCallResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

export function fail(message: string): ToolCallResult {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

export function toResult<T>(result: JintelResult<T>): ToolCallResult {
  if (result.success) return ok(result.data);
  return fail(result.error);
}

export function errorMessage(err: unknown): string {
  if (err instanceof JintelAuthError) {
    return `Authentication error: ${err.message}. Check JINTEL_API_KEY or JINTEL_WALLET_PRIVATE_KEY.`;
  }
  if (err instanceof JintelPaymentRequiredError) {
    const accept = err.quote?.accepts[0];
    const detail = accept
      ? ` (quote: ${accept.amount} of ${accept.asset} on ${accept.network} → ${accept.payTo})`
      : '';
    return `Payment required${detail}. Set JINTEL_WALLET_PRIVATE_KEY for x402 wallet mode, or raise JINTEL_X402_MAX_VALUE if the quote exceeds your cap.`;
  }
  if (err instanceof JintelUnreachableError) return `Jintel API unreachable: ${err.message}`;
  if (err instanceof JintelValidationError) return `Validation error: ${err.message}`;
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function runTool<T>(
  invoke: () => Promise<JintelResult<T>>,
): Promise<ToolCallResult> {
  try {
    const result = await invoke();
    return toResult(result);
  } catch (err) {
    return fail(errorMessage(err));
  }
}

// ── Input type guards ──────────────────────────────────────────────────────

export function asString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new JintelValidationError(
      `Argument '${field}' must be a non-empty string`,
    );
  }
  return value.trim();
}

export function asOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new JintelValidationError(`Argument '${field}' must be a string`);
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export function asOptionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new JintelValidationError(`Argument '${field}' must be a number`);
  }
  return value;
}

export function asStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new JintelValidationError(
      `Argument '${field}' must be a non-empty array of strings`,
    );
  }
  const out: string[] = [];
  for (const [i, item] of value.entries()) {
    if (typeof item !== 'string' || item.trim() === '') {
      throw new JintelValidationError(
        `Argument '${field}[${i}]' must be a non-empty string`,
      );
    }
    out.push(item.trim());
  }
  return out;
}

export const ENTITY_TYPES: EntityType[] = [
  'COMPANY',
  'PERSON',
  'CRYPTO',
  'COMMODITY',
  'INDEX',
];

export const FAMA_FRENCH_SERIES: FamaFrenchSeries[] = [
  'THREE_FACTOR_DAILY',
  'THREE_FACTOR_MONTHLY',
  'FIVE_FACTOR_DAILY',
  'FIVE_FACTOR_MONTHLY',
];

export function asEntityType(value: unknown, field: string): EntityType | undefined {
  if (value === undefined || value === null) return undefined;
  if (
    typeof value !== 'string' ||
    !ENTITY_TYPES.includes(value as EntityType)
  ) {
    throw new JintelValidationError(
      `Argument '${field}' must be one of ${ENTITY_TYPES.join(', ')}`,
    );
  }
  return value as EntityType;
}

export function asFamaFrenchSeries(value: unknown, field: string): FamaFrenchSeries {
  if (
    typeof value !== 'string' ||
    !FAMA_FRENCH_SERIES.includes(value as FamaFrenchSeries)
  ) {
    throw new JintelValidationError(
      `Argument '${field}' must be one of ${FAMA_FRENCH_SERIES.join(', ')}`,
    );
  }
  return value as FamaFrenchSeries;
}

export function asEnrichmentFields(
  value: unknown,
  field: string,
): EnrichmentField[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new JintelValidationError(
      `Argument '${field}' must be an array of strings`,
    );
  }
  const out: EnrichmentField[] = [];
  for (const [i, item] of value.entries()) {
    if (
      typeof item !== 'string' ||
      !ALL_ENRICHMENT_FIELDS.includes(item as EnrichmentField)
    ) {
      throw new JintelValidationError(
        `Argument '${field}[${i}]' must be one of: ${ALL_ENRICHMENT_FIELDS.join(', ')}`,
      );
    }
    out.push(item as EnrichmentField);
  }
  return out;
}

export const ENRICHMENT_FIELDS_SCHEMA = {
  type: 'array',
  description:
    'Optional list of enrichment sub-graphs to fetch. If omitted, all fields are returned.',
  items: {
    type: 'string',
    enum: [...ALL_ENRICHMENT_FIELDS],
  },
} as const;

// ── Additional input guards ────────────────────────────────────────────────

export function asOptionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'boolean') {
    throw new JintelValidationError(`Argument '${field}' must be a boolean`);
  }
  return value;
}

export function asOptionalStringArray(
  value: unknown,
  field: string,
): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new JintelValidationError(
      `Argument '${field}' must be an array of strings`,
    );
  }
  const out: string[] = [];
  for (const [i, item] of value.entries()) {
    if (typeof item !== 'string' || item.trim() === '') {
      throw new JintelValidationError(
        `Argument '${field}[${i}]' must be a non-empty string`,
      );
    }
    out.push(item.trim());
  }
  return out;
}

export function asOptionalEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new JintelValidationError(
      `Argument '${field}' must be one of ${allowed.join(', ')}`,
    );
  }
  return value as T;
}

export function asEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new JintelValidationError(
      `Argument '${field}' must be one of ${allowed.join(', ')}`,
    );
  }
  return value as T;
}

export function asOptionalEnumArray<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new JintelValidationError(`Argument '${field}' must be an array`);
  }
  const out: T[] = [];
  for (const [i, item] of value.entries()) {
    if (typeof item !== 'string' || !allowed.includes(item as T)) {
      throw new JintelValidationError(
        `Argument '${field}[${i}]' must be one of ${allowed.join(', ')}`,
      );
    }
    out.push(item as T);
  }
  return out;
}

// ── Enum value lists (for runtime validation + JSON Schema enums) ──────────

export const ASC_DESC = ['ASC', 'DESC'] as const;

// ── Field projection helper ────────────────────────────────────────────────

export function projectFields<T extends Record<string, unknown>>(
  rows: ReadonlyArray<T>,
  fields: ReadonlyArray<string> | undefined,
): Array<Partial<T>> {
  if (!fields || fields.length === 0) return rows.slice();
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const f of fields) {
      if (f in row) out[f] = row[f];
    }
    return out as Partial<T>;
  });
}

// ── Sub-graph helper ───────────────────────────────────────────────────────

/**
 * Fetch a single enrichment sub-graph for a ticker and return the relevant slice.
 * Used by all the per-domain tools (jintel_news, jintel_executives, etc) that wrap
 * `client.enrichEntity(ticker, [field], options)` and expose the field directly.
 *
 * Returns the entity ID + tickers + the requested slice, so the agent has just enough
 * context to know which entity it's looking at without re-fetching the full profile.
 */
export async function fetchSubGraph<K extends EnrichmentField>(
  client: JintelClient,
  ticker: string,
  field: K,
  options: EnrichOptions | undefined,
): Promise<
  JintelResult<{ id: string; tickers: string[] | null; data: Entity[K] }>
> {
  const result = await client.enrichEntity(ticker, [field], options);
  if (!result.success) return result;
  const entity = result.data;
  return {
    success: true,
    data: {
      id: entity.id,
      tickers: entity.tickers ?? null,
      data: entity[field],
    },
  };
}

/**
 * Build a generic ArraySubGraphOptions filter from raw args. Returns undefined if no
 * filter fields are present, so we don't waste a `filter` variable on noise.
 */
export function buildArrayFilter(
  args: Record<string, unknown>,
): ArraySubGraphOptions | undefined {
  const since = asOptionalString(args.since, 'since');
  const until = asOptionalString(args.until, 'until');
  const limit = asOptionalNumber(args.limit, 'limit');
  const sort = asOptionalEnum(args.sort, 'sort', ASC_DESC);
  if (since == null && until == null && limit == null && sort == null) {
    return undefined;
  }
  return { since, until, limit, sort };
}

// ── Reusable JSON Schema fragments ─────────────────────────────────────────

export const TICKER_SCHEMA = {
  type: 'string',
  description: 'Ticker symbol or entity ID (e.g., "AAPL", "BTC").',
} as const;

export const SINCE_SCHEMA = {
  type: 'string',
  description:
    'Only return items published on or after this ISO 8601 timestamp.',
} as const;

export const UNTIL_SCHEMA = {
  type: 'string',
  description:
    'Only return items published on or before this ISO 8601 timestamp.',
} as const;

export const LIMIT_SCHEMA = {
  type: 'number',
  description: 'Cap result count (default 20).',
} as const;

export const SORT_SCHEMA = {
  type: 'string',
  enum: ASC_DESC,
  description: 'Sort direction by date (default DESC — newest first).',
} as const;

export const OFFSET_SCHEMA = {
  type: 'number',
  description: 'Skip N rows for pagination (default 0).',
} as const;

export { ALL_ENRICHMENT_FIELDS };
export type { AcquisitionDirection, EnrichmentField, EntityType, FamaFrenchSeries };
