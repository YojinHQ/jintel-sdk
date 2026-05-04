import { describe, expect, it } from 'vitest';
import { stripPropertyDescriptions } from './schema-utils.js';

describe('stripPropertyDescriptions', () => {
  it('removes description from nested properties but keeps top-level', () => {
    const schema = {
      type: 'object',
      description: 'Top-level kept',
      properties: {
        ticker: { type: 'string', description: 'should be stripped' },
        limit: { type: 'number', description: 'also stripped' },
      },
      required: ['ticker'],
    };
    const out = stripPropertyDescriptions(schema);
    expect(out.description).toBe('Top-level kept');
    const props = out.properties as Record<string, { description?: string; type?: string }>;
    expect(props['ticker']?.description).toBeUndefined();
    expect(props['limit']?.description).toBeUndefined();
    expect(props['ticker']?.type).toBe('string');
  });

  it('preserves descriptions on the allowlist', () => {
    const schema = {
      type: 'object',
      properties: {
        cycle: { type: 'string', description: 'kept' },
        limit: { type: 'number', description: 'stripped' },
      },
    };
    const out = stripPropertyDescriptions(schema, new Set(['cycle']));
    const props = out.properties as Record<string, { description?: string }>;
    expect(props['cycle']?.description).toBe('kept');
    expect(props['limit']?.description).toBeUndefined();
  });

  it('recurses into items (arrays of objects)', () => {
    const schema = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'stripped' },
            },
          },
        },
      },
    };
    const out = stripPropertyDescriptions(schema);
    const outerProps = out.properties as Record<string, { items: Record<string, unknown> }>;
    const items = outerProps['items']?.items as {
      properties: Record<string, { description?: string }>;
    };
    expect(items?.properties['name']?.description).toBeUndefined();
  });

  it('preserves enum and type fields', () => {
    const schema = {
      type: 'object',
      properties: {
        color: { type: 'string', enum: ['red', 'blue'], description: 'stripped' },
      },
    };
    const out = stripPropertyDescriptions(schema);
    const color = (out.properties as Record<string, { type: string; enum: string[] }>)['color'];
    expect(color?.type).toBe('string');
    expect(color?.enum).toEqual(['red', 'blue']);
  });

  it('does not mutate the input', () => {
    const schema = {
      type: 'object',
      properties: { x: { type: 'string', description: 'orig' } },
    };
    const before = JSON.stringify(schema);
    stripPropertyDescriptions(schema);
    expect(JSON.stringify(schema)).toBe(before);
  });
});
