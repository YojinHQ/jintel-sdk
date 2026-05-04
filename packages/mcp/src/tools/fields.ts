export type ValidateFieldsResult =
  | { ok: true; fields: string[] | undefined }
  | { ok: false; error: string };

export function validateFields(
  input: string[] | undefined,
  valid: Set<string>,
): ValidateFieldsResult {
  if (input === undefined) return { ok: true, fields: undefined };
  if (!Array.isArray(input)) {
    return { ok: false, error: '`fields` must be an array of strings.' };
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of input) {
    if (typeof f !== 'string') {
      return { ok: false, error: '`fields` entries must be a string.' };
    }
    if (!valid.has(f)) {
      const sortedValid = Array.from(valid).sort().join(', ');
      return {
        ok: false,
        error: `unknown field "${f}". valid: ${sortedValid}`,
      };
    }
    if (!seen.has(f)) {
      seen.add(f);
      out.push(f);
    }
  }
  return { ok: true, fields: out };
}
