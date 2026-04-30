import { describe, it, expect } from 'vitest';
import { parseArgs, splitShellArgs } from './bench.js';

describe('bench CLI arg parsing', () => {
  it('parses --model --queries --variant', () => {
    const args = parseArgs(['--model', 'claude-haiku-4-5', '--queries', 'all', '--variant', 'bare']);
    expect(args.model).toBe('claude-haiku-4-5');
    expect(args.queries).toBe('all');
    expect(args.variant).toBe('bare');
  });

  it('defaults --queries to all and --variant to all', () => {
    const args = parseArgs(['--model', 'claude-haiku-4-5']);
    expect(args.queries).toBe('all');
    expect(args.variant).toBe('all');
  });

  it('throws when --model missing', () => {
    expect(() => parseArgs([])).toThrow(/model/i);
  });
});

describe('splitShellArgs', () => {
  it('splits on whitespace', () => {
    expect(splitShellArgs('-y @yojinhq/jintel-mcp')).toEqual(['-y', '@yojinhq/jintel-mcp']);
  });

  it('preserves double-quoted values containing spaces', () => {
    expect(splitShellArgs('--flag "hello world" tail')).toEqual(['--flag', 'hello world', 'tail']);
  });

  it('preserves single-quoted values containing spaces', () => {
    expect(splitShellArgs("--flag 'a b c'")).toEqual(['--flag', 'a b c']);
  });

  it('handles escaped quotes inside double quotes', () => {
    expect(splitShellArgs('"a\\"b"')).toEqual(['a"b']);
  });

  it('returns empty array on empty input', () => {
    expect(splitShellArgs('')).toEqual([]);
  });
});
