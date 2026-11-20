// Tests for scripts/step-command.mjs: npm and Prettier start through Node with no shell, and a path with a space or an &
// reaches Prettier whole. Run: node --test packages/editor/scripts/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { npmCli, stepCommand } from './step-command.mjs';

const here = dirname(fileURLToPath(import.meta.url));

test('npm and Prettier run through Node', () => {
  const [npmProgram, npmArgs] = stepCommand('npm', ['--version'], { from: here });
  assert.equal(npmProgram, process.execPath);
  const npm = spawnSync(npmProgram, npmArgs, { encoding: 'utf8' });
  assert.equal(npm.status, 0, npm.stderr);
  assert.match(npm.stdout, /^\d+\.\d+\.\d+/);

  const [program, args] = stepCommand('prettier', ['--version'], { from: here });
  assert.equal(program, process.execPath);
  const prettier = spawnSync(program, args, { encoding: 'utf8' });
  assert.equal(prettier.status, 0, prettier.stderr);
  assert.match(prettier.stdout, /^\d+\.\d+\.\d+/);
});

test('Prettier gets a path with a space and an & as one argument', () => {
  const dir = mkdtempSync(join(tmpdir(), 'step-command-'));
  try {
    const name = 'a b & c.json';
    writeFileSync(join(dir, name), '{"a":1}'); // not formatted, so --check fails by naming this very file
    const [program, args] = stepCommand('prettier', ['--check', '--ignore-unknown', name], { from: here });
    const result = spawnSync(program, args, { cwd: dir, encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr + result.stdout, /a b & c\.json/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('npmCli follows npm_execpath, also from npx, and is null when there is none', () => {
  const real = npmCli({}, process.execPath);
  assert.ok(real === null || /npm-cli\.c?js$/.test(real));
  if (real) {
    assert.equal(npmCli({ npm_execpath: real.replace(/npm-cli/, 'npx-cli') }, '/nowhere/node'), real);
    assert.equal(npmCli({ npm_execpath: real }, '/nowhere/node'), real);
  }
  assert.equal(npmCli({ npm_execpath: '/nowhere/yarn.js' }, '/nowhere/node'), null);
});
