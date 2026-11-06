// Tests that the starter keeps LF line endings in every site made from it, also on Windows (core.autocrlf=true):
// starter/.gitattributes holds the rule and the npm package ships it. Uses node:test and `npm pack --dry-run`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const pkgDir = fileURLToPath(new URL('../', import.meta.url));

test('starter/.gitattributes forces LF in every checkout', () => {
  const text = readFileSync(`${pkgDir}starter/.gitattributes`, 'utf8');
  assert.ok(!text.includes('\r'), 'the file itself has LF line breaks');
  assert.match(text, /^\* text=auto eol=lf$/m);
});

test('the npm package ships starter/.gitattributes', () => {
  const run = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: pkgDir, encoding: 'utf8', shell: true });
  assert.equal(run.status, 0, run.stderr);
  const [{ files }] = JSON.parse(run.stdout);
  assert.ok(files.some((f) => f.path === 'starter/.gitattributes'));
});
