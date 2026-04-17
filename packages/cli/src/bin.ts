#!/usr/bin/env node
import { run } from './cli.js';

run(process.argv.slice(2)).then(
  (code) => {
    process.exit(code);
  },
  (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`jintel: fatal: ${msg}\n`);
    process.exit(1);
  },
);
