/**
 * Returns a deep copy of `schema` with `description` removed from every
 * nested property object. Top-level `description` (on the schema itself)
 * is preserved. Properties whose name appears in `preserve` keep theirs.
 */
export function stripPropertyDescriptions(
  schema: Record<string, unknown>,
  preserve: Set<string> = new Set(),
): Record<string, unknown> {
  return walk(schema, preserve, /* isRoot */ true) as Record<string, unknown>;
}

function walk(node: unknown, preserve: Set<string>, isRoot: boolean): unknown {
  if (Array.isArray(node)) {
    return node.map((item) => walk(item, preserve, false));
  }
  if (node === null || typeof node !== 'object') {
    return node;
  }
  const obj = node as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (key === 'properties' && val && typeof val === 'object') {
      const props = val as Record<string, unknown>;
      const newProps: Record<string, unknown> = {};
      for (const [propName, propVal] of Object.entries(props)) {
        newProps[propName] = stripPropertyNode(propVal, preserve.has(propName), preserve);
      }
      out[key] = newProps;
    } else if (key === 'items') {
      out[key] = walk(val, preserve, false);
    } else {
      out[key] = walk(val, preserve, isRoot);
    }
  }
  return out;
}

function stripPropertyNode(
  node: unknown,
  keepDescription: boolean,
  preserve: Set<string>,
): unknown {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) {
    return walk(node, preserve, false);
  }
  const obj = node as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (key === 'description' && !keepDescription) continue;
    if (key === 'properties' && val && typeof val === 'object') {
      out[key] = walk({ properties: val }, preserve, false);
      out[key] = (out[key] as Record<string, unknown>).properties;
    } else if (key === 'items') {
      out[key] = walk(val, preserve, false);
    } else {
      out[key] = walk(val, preserve, false);
    }
  }
  return out;
}
