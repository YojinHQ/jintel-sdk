/**
 * Minimal argv parser. Supports:
 *   - `--flag` boolean
 *   - `--key value` string
 *   - `--key=value` string
 *   - `-x` short boolean (single char)
 *   - `--` end-of-flags marker
 *
 * Everything else is a positional argument.
 */
export interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};

  let i = 0;
  while (i < argv.length) {
    const token = argv[i];

    if (token === "--") {
      for (let j = i + 1; j < argv.length; j++) {
        positionals.push(argv[j]);
      }
      break;
    }

    if (token.startsWith("--")) {
      const body = token.slice(2);
      const eq = body.indexOf("=");
      if (eq >= 0) {
        flags[body.slice(0, eq)] = body.slice(eq + 1);
        i++;
        continue;
      }
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("-")) {
        flags[body] = next;
        i += 2;
        continue;
      }
      flags[body] = true;
      i++;
      continue;
    }

    if (token.startsWith("-") && token.length > 1) {
      const body = token.slice(1);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("-")) {
        flags[body] = next;
        i += 2;
        continue;
      }
      flags[body] = true;
      i++;
      continue;
    }

    positionals.push(token);
    i++;
  }

  return { positionals, flags };
}

export function getString(
  flags: Record<string, string | boolean>,
  ...names: string[]
): string | undefined {
  for (const n of names) {
    const v = flags[n];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

export function getBool(
  flags: Record<string, string | boolean>,
  ...names: string[]
): boolean {
  for (const n of names) {
    if (flags[n] === true || flags[n] === "true") return true;
  }
  return false;
}

export function getNumber(
  flags: Record<string, string | boolean>,
  ...names: string[]
): number | undefined {
  const v = getString(flags, ...names);
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Tri-state boolean flag — returns `true` when set, `false` when explicitly
 * `--name=false` / `--name false`, and `undefined` when absent. Use this when
 * "not passed" must be distinct from "passed as false" (e.g. filter inputs that
 * the API treats specially when omitted).
 */
export function getTriBool(
  flags: Record<string, string | boolean>,
  ...names: string[]
): boolean | undefined {
  for (const n of names) {
    const v = flags[n];
    if (v === undefined) continue;
    if (v === true || v === "true") return true;
    if (v === false || v === "false") return false;
  }
  return undefined;
}

/**
 * Parse a comma-separated string flag into an array of trimmed, non-empty values.
 * Returns `undefined` when the flag is absent.
 */
export function getStringList(
  flags: Record<string, string | boolean>,
  ...names: string[]
): string[] | undefined {
  const raw = getString(flags, ...names);
  if (raw === undefined) return undefined;
  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  return parts.length > 0 ? parts : undefined;
}
