import { describe, it, expect } from 'vitest';
import { parseArgs } from './report.js';

describe('report CLI arg parsing', () => {
  it('--all flag is disabled by default', () => {
    expect(parseArgs([])).toEqual({ all: false });
  });

  it('--all flag enables all-sweeps mode', () => {
    expect(parseArgs(['--all'])).toEqual({ all: true });
  });
});
