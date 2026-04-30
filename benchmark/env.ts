export function pickEnv(keys: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const v = process.env[key];
    if (v !== undefined) out[key] = v;
  }
  return out;
}
