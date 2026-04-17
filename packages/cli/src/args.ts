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

    if (token === '--') {
      for (let j = i + 1; j < argv.length; j++) {
        positionals.push(argv[j]);
      }
      break;
    }

    if (token.startsWith('--')) {
      const body = token.slice(2);
      const eq = body.indexOf('=');
      if (eq >= 0) {
        flags[body.slice(0, eq)] = body.slice(eq + 1);
        i++;
        continue;
      }
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('-')) {
        flags[body] = next;
        i += 2;
        continue;
      }
      flags[body] = true;
      i++;
      continue;
    }

    if (token.startsWith('-') && token.length > 1) {
      const body = token.slice(1);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('-')) {
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

export function getString(flags: Record<string, string | boolean>, ...names: string[]): string | undefined {
  for (const n of names) {
    const v = flags[n];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return undefined;
}

export function getBool(flags: Record<string, string | boolean>, ...names: string[]): boolean {
  for (const n of names) {
    if (flags[n] === true || flags[n] === 'true') return true;
  }
  return false;
}

export function getNumber(flags: Record<string, string | boolean>, ...names: string[]): number | undefined {
  const v = getString(flags, ...names);
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
