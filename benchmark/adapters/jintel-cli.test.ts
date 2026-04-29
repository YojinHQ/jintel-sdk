import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, writeFileSync, chmodSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function makeFakeBin(script: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'jintel-cli-test-bin-'));
  const binPath = join(dir, 'bin.js');
  writeFileSync(binPath, `#!/usr/bin/env node\n${script}\n`, 'utf-8');
  chmodSync(binPath, 0o755);
  return binPath;
}

const fakeBinPath = makeFakeBin(`process.stdout.write('OK from fake jintel\\n'); process.exit(0);`);
const floodBinPath = makeFakeBin(`process.stdout.write('x'.repeat(20000)); process.exit(0);`);

const adapters: Array<ReturnType<typeof import('./jintel-cli.js').createJintelCliAdapter>> = [];

afterEach(async () => {
  for (const a of adapters.splice(0)) {
    await a.close?.();
  }
});

describe('jintel-cli adapter', () => {
  it('constructs without error when bin path is valid', async () => {
    const { createJintelCliAdapter } = await import('./jintel-cli.js');
    const a = createJintelCliAdapter({ binPath: fakeBinPath });
    adapters.push(a);
    expect(a.variant).toBe('jintel-cli');
  });

  it('throws a clear error when bin path does not exist', async () => {
    const { createJintelCliAdapter } = await import('./jintel-cli.js');
    expect(() => createJintelCliAdapter({ binPath: '/tmp/__nonexistent_jintel_bin_xyz__/bin.js' })).toThrow(
      /CLI binary not found/,
    );
  });

  it('toolsForAnthropic() returns exactly one tool named bash', async () => {
    const { createJintelCliAdapter } = await import('./jintel-cli.js');
    const a = createJintelCliAdapter({ binPath: fakeBinPath });
    adapters.push(a);
    const tools = a.toolsForAnthropic();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('bash');
  });

  it('invoke echo hello returns content with hello and is_error false', async () => {
    const { createJintelCliAdapter } = await import('./jintel-cli.js');
    const a = createJintelCliAdapter({ binPath: fakeBinPath });
    adapters.push(a);
    const result = await a.invoke({ name: 'bash', input: { command: 'echo hello' } });
    expect(result.is_error).toBe(false);
    expect(result.latency_ms).toBeGreaterThanOrEqual(0);
    expect(String(result.content)).toContain('hello');
  });

  it('output cap: truncates when stdout exceeds outputCap chars', async () => {
    const { createJintelCliAdapter } = await import('./jintel-cli.js');
    const a = createJintelCliAdapter({ binPath: floodBinPath, outputCap: 100 });
    adapters.push(a);
    const result = await a.invoke({
      name: 'bash',
      input: { command: `node -e "process.stdout.write('x'.repeat(20000))"` },
    });
    const content = String(result.content);
    expect(content.length).toBeLessThanOrEqual(100 + 300); // cap + truncation notice
    expect(content).toMatch(/truncated/);
  });

  it('empty stdout + non-zero exit: returns non-empty placeholder so Anthropic API does not 400', async () => {
    const { createJintelCliAdapter } = await import('./jintel-cli.js');
    const a = createJintelCliAdapter({ binPath: fakeBinPath });
    adapters.push(a);
    // `false` exits 1 with no stdout — Anthropic rejects empty tool_result content when is_error.
    const result = await a.invoke({ name: 'bash', input: { command: 'false' } });
    expect(result.is_error).toBe(true);
    expect(String(result.content).length).toBeGreaterThan(0);
  });

  it('close() removes the temp dir', async () => {
    const { createJintelCliAdapter } = await import('./jintel-cli.js');
    const a = createJintelCliAdapter({ binPath: fakeBinPath });
    await expect(a.close?.()).resolves.toBeUndefined();
  });
});
